#!/usr/bin/env python3
"""bundle_scrape.py — engenharia reversa leve: extrai rotas de API do JS compilado de um site.

Complementa o parse_har.py. O HAR só vê o que você navegou; o bundle contém TODAS as rotas
que o frontend conhece — inclusive as que nenhum clique alcança (admin, checkout, área logada).

Fluxo:
  1. baixa o HTML da página (curl_cffi impersonando Chrome → passa por Cloudflare)
  2. acha os <script src> do próprio host (main/app/chunk/vendor…)
  3. baixa cada bundle e extrai caminhos de API por regex
  4. filtra ruído, normaliza IDs → {id}, cruza com prefixos observados no HAR
  5. (opcional --verify) sonda as rotas GET estáticas via curl_cffi e marca status/JSON

Uso:
  bundle_scrape.py <url-do-site> [--prefix /api/ ...] [--verify] [--cookies "k=v; k2=v2"]
  bundle_scrape.py <arquivo.html> --base https://host [...]

Saída: JSON no stdout.
"""
import sys, re, json, argparse
from urllib.parse import urlparse, urljoin

# --- transporte: curl_cffi (passa Cloudflare) com fallback urllib ---
def _fetch(url, cookies=None, timeout=25):
    """Retorna (status, text). Prefere curl_cffi impersonando Chrome."""
    try:
        from curl_cffi import requests as creq
        r = creq.get(url, impersonate="chrome", timeout=timeout,
                     headers={"Accept": "*/*"},
                     cookies=dict(c.strip().split("=", 1) for c in (cookies or "").split(";") if "=" in c) or None)
        return r.status_code, r.text
    except ImportError:
        import urllib.request
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "*/*", **({"Cookie": cookies} if cookies else {})})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status, resp.read().decode("utf-8", "replace")
        except Exception as e:
            return getattr(e, "code", 0), ""
    except Exception as e:
        return 0, ""


# --- extração de rotas do JS ---
# 1) rotas em chamadas de método (alta precisão): fetch(...), axios.get(...), .post(...), $http.put(...)
METHOD_CALL = re.compile(
    r"""(?:fetch|axios|\$http|http|request|api|client)?\s*
        \.?(get|post|put|patch|delete|fetch|request)\s*\(\s*
        [`'"]([^`'"]+)[`'"]\s*(\+)?""",   # (\+)? = concatenação de id logo após a string
    re.VERBOSE | re.IGNORECASE)
# 2) literais de string que parecem caminho de API
STRING_PATH = re.compile(r"""[`'"](/[A-Za-z0-9_][A-Za-z0-9_\-./${}:]*)[`'"]""")
# 3) hints de base de API no config do bundle
BASE_HINT = re.compile(r"""(?:api[_-]?url|base[_-]?url|apiBase|API_URL|endpoint)\s*[:=]\s*[`'"](https?://[^`'"]+|/[^`'"]+)[`'"]""", re.IGNORECASE)
# 4) operações GraphQL
GQL_OP = re.compile(r"""(?:operationName)\s*[:=]\s*[`'"]([A-Za-z][A-Za-z0-9_]*)[`'"]""")

# chunks de code-splitting referenciados DENTRO de um bundle (Vite/webpack): "Checkout.4409bb11.js"
CHUNK_REF = re.compile(r"""["']([^"']*?\.[0-9a-f]{6,}\.m?js)["']""")
ASSET_EXT = re.compile(r"\.(?:js|mjs|css|png|jpe?g|gif|svg|webp|woff2?|ttf|eot|ico|map|json|txt|xml|mp4|webm)(?:$|[?#])", re.IGNORECASE)
API_HINT = re.compile(r"^/(?:api|v\d+|graphql|gql|rest|rpc|internal|_api|services?|data)\b", re.IGNORECASE)
# ruído: caminhos que são claramente rota de front (páginas), não API
FRONT_NOISE = re.compile(r"^/(?:assets?|static|images?|img|fonts?|css|js|_next/static|favicon)\b", re.IGNORECASE)


def normalize(path):
    """Tira query/hash, colapsa ${...} e ids numéricos/uuid → {id}."""
    path = path.split("?", 1)[0].split("#", 1)[0]
    path = re.sub(r"\$\{[^}]+\}", "{id}", path)          # `/api/x/${id}` → /api/x/{id}
    path = re.sub(r":[A-Za-z_][A-Za-z0-9_]*", "{id}", path)  # /api/x/:id → /api/x/{id}
    path = re.sub(r"/\d+(?=/|$)", "/{id}", path)         # /api/x/123 → /api/x/{id}
    path = re.sub(r"/[0-9a-f]{8}-[0-9a-f-]{20,}(?=/|$)", "/{id}", path, flags=re.I)  # uuid
    if len(path) > 1:
        path = path.rstrip("/")           # /api/x/ → /api/x
    return path


def _too_generic(path):
    """Rota só com prefixo + segmentos {id}, sem nenhum segmento literal → ruído.
    Ex.: /api/{id}/{id} (veio de `/api/${a}/${b}`) não identifica nada."""
    segs = [s for s in path.strip("/").split("/") if s]
    literal = [s for s in segs[1:] if s != "{id}"]  # ignora o 1º seg (api/v1/…)
    return len(literal) == 0


def looks_like_api(path, prefixes):
    if not path.startswith("/") or path.startswith("//"):
        return False
    if ASSET_EXT.search(path) or FRONT_NOISE.match(path):
        return False
    if " " in path or "\\" in path or len(path) < 3:
        return False
    if _too_generic(path):
        return False
    if any(path.startswith(p) for p in prefixes):
        return True
    return bool(API_HINT.match(path))


def extract_from_js(js, prefixes):
    """Retorna dict path -> {methods:set, from_call:bool} e lista de ops graphql + base hints."""
    found = {}
    def add(p, method=None, from_call=False):
        p = normalize(p)
        if not looks_like_api(p, prefixes):
            return
        e = found.setdefault(p, {"methods": set(), "from_call": False})
        if method:
            e["methods"].add(method.upper())
        e["from_call"] = e["from_call"] or from_call

    for m in METHOD_CALL.finditer(js):
        meth, path, concat = m.group(1), m.group(2), m.group(3)
        if path.startswith("/") or path.startswith("http"):
            raw = urlparse(path).path if path.startswith("http") else path
            if concat and raw.endswith("/"):   # `"/api/x/orders/"+id` → detalhe por id
                raw = raw + "{id}"
            add(raw, method=None if meth.lower() in ("fetch", "request") else meth, from_call=True)
    for m in STRING_PATH.finditer(js):
        add(m.group(1))
    bases = sorted(set(m.group(1) for m in BASE_HINT.finditer(js)))
    gql = sorted(set(m.group(1) for m in GQL_OP.finditer(js)))
    return found, bases, gql


def _dirurl(u):
    """URL do diretório de um arquivo: .../assets/app.js → .../assets/"""
    return u.rsplit("/", 1)[0] + "/"


def find_bundles(html, base, cap=20):
    srcs = re.findall(r"""<script[^>]+src=["']([^"']+)["']""", html, re.IGNORECASE)
    host = urlparse(base).netloc
    out = []
    for s in srcs:
        full = urljoin(base, s)
        if urlparse(full).netloc != host:
            continue
        if not re.search(r"\.m?js(?:$|[?#])", full, re.IGNORECASE):
            continue
        out.append(full)
    # prioriza bundles "principais"
    out = sorted(set(out), key=lambda u: (0 if re.search(r"(main|app|index|runtime|vendor|chunk|bundle)", u, re.I) else 1, u))
    return out[:cap]


def verify_paths(paths, base, cookies):
    """Sonda rotas GET estáticas (sem {id}). Marca status + se veio JSON."""
    from urllib.parse import urljoin as _uj
    for p in paths:
        if "{id}" in p["path"] or (p["methods"] and "GET" not in p["methods"]):
            p["verified"] = None
            continue
        status, text = _fetch(_uj(base, p["path"]), cookies=cookies)
        is_json = False
        t = (text or "").lstrip()
        if status == 200 and t[:1] in "[{":
            try:
                json.loads(text); is_json = True
            except Exception:
                is_json = False
        p["verified"] = {"status": status, "json": is_json}
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("target", help="URL do site ou arquivo .html")
    ap.add_argument("--base", help="base URL (se target for arquivo)")
    ap.add_argument("--prefix", action="append", default=[], help="prefixo observado no HAR (repetível), ex: /api/")
    ap.add_argument("--verify", action="store_true", help="sonda rotas GET estáticas via curl_cffi")
    ap.add_argument("--cookies", default="", help='cookies "k=v; k2=v2" (pra verify autenticado)')
    ap.add_argument("--cap", type=int, default=80, help="máx de bundles/chunks a baixar (BFS)")
    args = ap.parse_args()

    if re.match(r"^https?://", args.target):
        base = args.target
        status, html = _fetch(args.target, cookies=args.cookies)
        if not html:
            print(json.dumps({"error": f"não baixou o HTML (status {status}). Cloudflare? tente com curl_cffi instalado."}))
            sys.exit(1)
    else:
        base = args.base or ""
        html = open(args.target, encoding="utf-8", errors="replace").read()
        if not base:
            print(json.dumps({"error": "target é arquivo; passe --base https://host"})); sys.exit(1)

    # BFS: começa nos <script src> e SEGUE os chunks de code-splitting referenciados
    # dentro de cada bundle (é onde as SPAs escondem a API — Checkout, Account, etc.).
    queue = find_bundles(html, base, cap=args.cap)
    host = urlparse(base).netloc
    visited, scanned = set(), []
    all_found, all_bases, all_gql = {}, set(), set()
    while queue and len(scanned) < args.cap:
        burl = queue.pop(0)
        if burl in visited:
            continue
        visited.add(burl)
        st, js = _fetch(burl, cookies=args.cookies)
        if not js:
            continue
        scanned.append(burl)
        found, bases, gql = extract_from_js(js, args.prefix)
        for p, e in found.items():
            agg = all_found.setdefault(p, {"methods": set(), "from_call": False})
            agg["methods"] |= e["methods"]; agg["from_call"] = agg["from_call"] or e["from_call"]
        all_bases |= set(bases); all_gql |= set(gql)
        # enfileira os chunks referenciados aqui (basename resolvido no dir deste bundle)
        for ref in CHUNK_REF.findall(js):
            child = _dirurl(burl) + ref.rsplit("/", 1)[-1]
            if child not in visited and urlparse(child).netloc == host:
                queue.append(child)

    prefixes = args.prefix
    paths = []
    for p, e in sorted(all_found.items()):
        paths.append({
            "path": p,
            "methods": sorted(e["methods"]),
            "from_call": e["from_call"],                         # veio de fetch/axios → alta confiança
            "prefix_match": any(p.startswith(pre) for pre in prefixes),  # bate com o que o HAR viu
            "verified": None,
        })

    if args.verify:
        paths = verify_paths(paths, base, args.cookies)

    print(json.dumps({
        "base_url": base,
        "bundles_scanned": scanned,
        "api_base_hints": sorted(all_bases),
        "graphql_ops": sorted(all_gql),
        "path_count": len(paths),
        "paths": paths,
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
