#!/usr/bin/env python3
"""
Parse a HAR file and extract API information for skill generation.
Usage: python3 parse_har.py <har_file> [--host <filter_host>]
"""

import json
import sys
import re
import base64
import argparse
from urllib.parse import urlparse, parse_qs


def _b64url_decode(s):
    s += '=' * (-len(s) % 4)
    try:
        return base64.urlsafe_b64decode(s).decode('utf-8', errors='ignore')
    except Exception:
        return ''


def decode_jwt(token):
    """Return (header, payload) dicts for a JWT, or (None, None) if not parseable."""
    parts = token.split('.')
    if len(parts) != 3:
        return None, None
    try:
        h = json.loads(_b64url_decode(parts[0]))
        p = json.loads(_b64url_decode(parts[1]))
        return h, p
    except Exception:
        return None, None

ANALYTICS_PATTERNS = re.compile(
    r'google|facebook|hotjar|gtm|ga\.|_fb|clarity|amplitude|segment|mixpanel|heap|intercom|zendesk|hubspot|drift|crisp|tawk|analytics|tracking|pixel|beacon|bn2o|doubleclick|googlesyndication|usermaven|contentsquare|posthog|sentry\.io|datadoghq|newrelic|fullstory|logrocket|bugsnag|cloudflareinsights|linkedin\.com/(px|wa)|/collect\b|cdn\.matomo|stats\.g\.doubleclick|tiktok\.com/i18n/pixel|adsystem\.com|adnxs|criteo',
    re.IGNORECASE
)

ASSET_EXTENSIONS = {'.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.webp', '.avif', '.map'}

ANALYTICS_COOKIES = re.compile(r'^(_ga|_gid|_gat|_fbp|_fbc|_gcl|_hjS|_hjU|amplitude|ajs_|intercom|hubspot|drift|crisp)', re.IGNORECASE)

SESSION_COOKIE_PATTERNS = re.compile(r'session|token|auth|login|logged|user|account|csrf|xsrf|remember|bearer|jwt|sid|^[a-z]+$', re.IGNORECASE)

# Cookies de clearance do Cloudflare — precisam ser mantidos pro modo Surf
# (replay via curl_cffi impersonando o Chrome, sem browser aberto).
CLOUDFLARE_COOKIE = re.compile(r'^(cf_clearance|__cf_bm|__cflb)$', re.IGNORECASE)

ID_PATTERNS = [
    (re.compile(r'/[0-9a-f]{32}(?=/|$)'), '/{hex32}'),
    (re.compile(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=/|$)'), '/{uuid}'),
    (re.compile(r'/[a-zA-Z]+-\d{4,}(?=/|$)'), '/{slug-id}'),
    (re.compile(r'/\d{3,}(?=/|$)'), '/{id}'),
]


def parametrize_path(path):
    for pattern, replacement in ID_PATTERNS:
        path = pattern.sub(replacement, path)
    return path


def is_noise(url, host_filter):
    parsed = urlparse(url)
    if host_filter and host_filter not in parsed.netloc:
        return True
    if ANALYTICS_PATTERNS.search(parsed.netloc):
        return True
    path = parsed.path.lower()
    if any(path.endswith(ext) for ext in ASSET_EXTENSIONS):
        return True
    if ANALYTICS_PATTERNS.search(path):
        return True
    return False


def classify_cookies(cookie_string):
    if not cookie_string:
        return {}, {}
    session = {}
    analytics = {}
    for part in cookie_string.split(';'):
        part = part.strip()
        if '=' not in part:
            continue
        name, _, value = part.partition('=')
        name = name.strip()
        if ANALYTICS_COOKIES.match(name):
            analytics[name] = value.strip()
        elif CLOUDFLARE_COOKIE.match(name) or SESSION_COOKIE_PATTERNS.search(name):
            session[name] = value.strip()
    return session, analytics


def detect_proxy_envelope(entries, main_host):
    """Padrão proxy-envelope: quase tudo bate numa URL só, com o destino real
    no corpo (service/method/path). Retorna (is_proxy, {proxy_url, routes})."""
    from collections import Counter
    paths, bodies = Counter(), []
    for e in entries:
        req = e['request']
        u = urlparse(req['url'])
        if u.netloc != main_host or req['method'].upper() not in ('POST', 'PUT'):
            continue
        if is_noise(req['url'], None):
            continue
        paths[u.path] += 1
        try:
            b = json.loads(req.get('postData', {}).get('text', '') or '{}')
            if isinstance(b, dict):
                bodies.append((u.path, b))
        except Exception:
            pass
    if not paths:
        return False, {}
    top_path, top_n = paths.most_common(1)[0]
    total = sum(paths.values())
    routing_keys = {'service', 'method', 'path', 'route', 'endpoint', 'operation', 'action'}
    routed = [b for p, b in bodies if p == top_path and routing_keys & {k.lower() for k in b}]
    if top_n / total >= 0.6 and len(routed) >= max(2, int(0.5 * top_n)):
        routes = {}
        for b in routed:
            low = {k.lower(): v for k, v in b.items()}
            svc = low.get('service') or low.get('endpoint') or low.get('route')
            pth = low.get('path') or low.get('method') or low.get('operation') or low.get('action')
            if isinstance(pth, str):
                routes[pth] = svc if isinstance(svc, str) else 'default'
        return True, {'proxy_url': top_path, 'routes': routes}
    return False, {}


def detect_graphql(entries, main_host):
    """Detecta GraphQL + persisted queries (extensions.persistedQuery.sha256Hash)."""
    ops, persisted, endpoint = [], False, None
    for e in entries:
        req = e['request']
        u = urlparse(req['url'])
        if u.netloc != main_host:
            continue
        is_gql_path = 'graphql' in u.path.lower() or u.path.lower().endswith('/gql')
        try:
            body = json.loads(req.get('postData', {}).get('text', '') or 'null')
        except Exception:
            body = None
        for b in (body if isinstance(body, list) else [body]):
            if not isinstance(b, dict):
                continue
            if not (is_gql_path or 'query' in b or 'operationName' in b or 'extensions' in b):
                continue
            endpoint = endpoint or f"{req['method']} {u.path}"
            op = b.get('operationName')
            if op and op not in ops:
                ops.append(op)
            ext = b.get('extensions') or {}
            if isinstance(ext, dict) and 'persistedQuery' in ext:
                persisted = True
    if not endpoint:
        return {'is_graphql': False}
    return {'is_graphql': True, 'endpoint': endpoint, 'persisted_queries': persisted, 'operations': ops[:40]}


def parse_har(har_path, host_filter=None):
    with open(har_path, encoding='utf-8') as f:
        har = json.load(f)

    entries = har['log']['entries']
    endpoints = {}
    hosts_seen = set()
    session_cookies = {}
    csrf_token = None
    cookie_expiry = {}
    has_cloudflare = False
    has_csrf_header = False

    # detect main host — Bearer-aware ranking (lessons from Pluggy):
    #   1. hosts with `Authorization: Bearer` win over hosts without
    #   2. tracker domains already excluded by is_noise (ANALYTICS_PATTERNS)
    #   3. fallback: most-called non-noise host with /api/ path
    bearer_hosts = {}      # host -> count of Bearer-authed calls
    api_host_calls = {}    # host -> count of /api/ calls (fallback)
    call_hosts = {}        # host -> count of all non-noise calls (last-resort fallback)
    bearer_tokens = []     # all unique Bearer values seen (for JWT inspection)
    for entry in entries:
        u = urlparse(entry['request']['url'])
        if is_noise(entry['request']['url'], None):
            continue
        call_hosts[u.netloc] = call_hosts.get(u.netloc, 0) + 1
        for h in entry['request'].get('headers', []):
            if h['name'].lower() == 'authorization' and h['value'].lower().startswith('bearer '):
                bearer_hosts[u.netloc] = bearer_hosts.get(u.netloc, 0) + 1
                tok = h['value'].split(' ', 1)[1]
                if tok and tok not in bearer_tokens:
                    bearer_tokens.append(tok)
                break
        if '/api/' in u.path:
            api_host_calls[u.netloc] = api_host_calls.get(u.netloc, 0) + 1

    if host_filter:
        main_host = host_filter
    elif bearer_hosts:
        main_host = max(bearer_hosts, key=bearer_hosts.get)
    elif api_host_calls:
        main_host = max(api_host_calls, key=api_host_calls.get)
    elif call_hosts:
        # nenhum host tem /api/ nem Bearer — API pode viver em /graphql, /v1, /rpc, /gql.
        # Pega o host não-tracker mais chamado (cobre GraphQL-only e REST fora de /api/).
        main_host = max(call_hosts, key=call_hosts.get)
    else:
        main_host = ''

    # decode Bearer JWTs to detect Auth0/Okta/Cognito (helps infer mint flow)
    auth_provider = None
    auth_audience = None
    for tok in bearer_tokens:
        hdr, payload = decode_jwt(tok)
        if not payload:
            continue
        iss = payload.get('iss', '')
        if 'auth0' in iss.lower():
            auth_provider = 'auth0'
        elif 'okta' in iss.lower():
            auth_provider = 'okta'
        elif 'amazoncognito' in iss.lower() or 'cognito' in iss.lower():
            auth_provider = 'cognito'
        elif 'firebase' in iss.lower() or 'google' in iss.lower():
            auth_provider = 'google-identity'
        elif iss:
            auth_provider = iss
        aud = payload.get('aud')
        if aud and not auth_audience:
            auth_audience = aud[0] if isinstance(aud, list) else aud
        if auth_provider:
            break

    # infer mint endpoint: last same-origin request issued BEFORE the first appearance of a Bearer call
    # against the main_host. The site's frontend mints the token there.
    mint_endpoint = None
    if bearer_tokens and main_host:
        site_origins = set()  # origins (probably the Next.js app) where the user is logged in
        first_bearer_idx = None
        for i, e in enumerate(entries):
            u = urlparse(e['request']['url'])
            if u.netloc == main_host:
                for h in e['request'].get('headers', []):
                    if h['name'].lower() == 'authorization' and h['value'].lower().startswith('bearer '):
                        first_bearer_idx = i
                        break
                if first_bearer_idx is not None:
                    break
        if first_bearer_idx is not None:
            # walk backwards looking for a JSON-returning POST/GET to /api/ on a non-tracker host
            for j in range(first_bearer_idx - 1, max(0, first_bearer_idx - 50), -1):
                e = entries[j]
                u = urlparse(e['request']['url'])
                if is_noise(e['request']['url'], None):
                    continue
                if u.netloc == main_host:
                    continue  # mint can't be on the API host itself
                if '/api/' not in u.path:
                    continue
                # confirm response is JSON and references token-like fields
                ct = ''
                for rh in e['response'].get('headers', []):
                    if rh['name'].lower() == 'content-type':
                        ct = rh['value']
                        break
                if 'json' not in ct.lower():
                    continue
                body_text = e['response'].get('content', {}).get('text', '') or ''
                if 'access' in body_text.lower() and 'token' in body_text.lower():
                    mint_endpoint = f"{e['request']['method']} https://{u.netloc}{u.path}"
                    break

    for entry in entries:
        req = entry['request']
        resp = entry['response']
        url = req['url']
        parsed = urlparse(url)

        if is_noise(url, host_filter):
            continue

        hosts_seen.add(parsed.netloc)
        method = req['method'].upper()
        path = parsed.path or '/'
        template = parametrize_path(path)
        # for 3rd-party hosts, capture full param values (likely API keys/credentials)
        # for main host, only param names (values are user data that varies)
        is_third_party = parsed.netloc != main_host
        if is_third_party:
            query_params_full = {k: v[0] for k, v in parse_qs(parsed.query).items()}
        else:
            query_params_full = {k: None for k in parse_qs(parsed.query).keys()}

        # skip HTML pages — only keep JSON/API calls
        resp_content_type = ''
        for rh in resp.get('headers', []):
            if rh['name'].lower() == 'content-type':
                resp_content_type = rh['value']
                break
        is_api = (
            '/api/' in path or
            'application/json' in resp_content_type or
            method in ('POST', 'PUT', 'PATCH', 'DELETE')
        )
        if not is_api:
            continue

        # extract auth headers
        req_headers = {h['name'].lower(): h['value'] for h in req.get('headers', [])}
        cookie_str = req_headers.get('cookie', '')
        s_cookies, _ = classify_cookies(cookie_str)
        # only keep cookies sent to main_host or its parent domain — avoids LinkedIn/etc tracker pollution
        if s_cookies and main_host:
            main_root = '.'.join(main_host.split('.')[-2:])
            if parsed.netloc == main_host or parsed.netloc.endswith('.' + main_root) or parsed.netloc == main_root:
                session_cookies.update(s_cookies)

        if 'x-csrf-token' in req_headers or 'x-xsrf-token' in req_headers:
            has_csrf_header = True
            if not csrf_token:
                csrf_token = req_headers.get('x-csrf-token') or req_headers.get('x-xsrf-token')

        # detect Cloudflare in response headers (only for main host)
        if not is_third_party and not has_cloudflare:
            for rh in resp.get('headers', []):
                hname = rh['name'].lower()
                if hname == 'cf-ray':
                    has_cloudflare = True
                    break
                if hname == 'server' and 'cloudflare' in rh['value'].lower():
                    has_cloudflare = True
                    break

        # extract Set-Cookie expiry
        for rh in resp.get('headers', []):
            if rh['name'].lower() == 'set-cookie':
                val = rh['value']
                name = val.split('=')[0].strip()
                if SESSION_COOKIE_PATTERNS.search(name):
                    exp = re.search(r'[Mm]ax-[Aa]ge=(\d+)', val)
                    if exp and name not in cookie_expiry:
                        cookie_expiry[name] = int(exp.group(1))

        # extract request body — for 3rd party, full sample; for main, just keys
        body_schema = None
        body_sample = None
        if req.get('postData'):
            try:
                body = json.loads(req['postData'].get('text', ''))
                if isinstance(body, dict):
                    body_schema = list(body.keys())
                    if is_third_party:
                        body_sample = body
            except Exception:
                pass

        # deduplicate by template
        key = f"{method} {parsed.netloc}{template}"
        if key not in endpoints:
            endpoints[key] = {
                'method': method,
                'host': parsed.netloc,
                'path_template': template,
                'example_path': path,
                'status_codes': set(),
                'query_params': dict(query_params_full),
                'body_fields': body_schema,
                'body_sample': body_sample,
                'is_third_party': is_third_party,
                'requires_auth': bool(s_cookies or csrf_token) and not is_third_party,
                'count': 0,
            }

        endpoints[key]['status_codes'].add(resp['status'])
        for k, v in query_params_full.items():
            if k not in endpoints[key]['query_params'] or (v and not endpoints[key]['query_params'][k]):
                endpoints[key]['query_params'][k] = v
        endpoints[key]['count'] += 1

    # detect main_host response shape: array vs paginated object
    # (lesson: Pluggy returns raw arrays — `r.results || []` breaks; correct is `r.results || r`)
    response_shape = None
    if main_host:
        for entry in entries:
            u = urlparse(entry['request']['url'])
            if u.netloc != main_host or entry['request']['method'].upper() != 'GET':
                continue
            ct = ''
            for rh in entry['response'].get('headers', []):
                if rh['name'].lower() == 'content-type':
                    ct = rh['value']; break
            if 'json' not in ct.lower():
                continue
            txt = entry['response'].get('content', {}).get('text', '') or ''
            if not txt or txt[0] not in '[{':
                continue
            try:
                body = json.loads(txt)
            except Exception:
                continue
            if isinstance(body, list):
                response_shape = 'array'
                break
            if isinstance(body, dict) and ('results' in body or 'data' in body or 'items' in body) and ('total' in body or 'totalPages' in body or 'page' in body or 'next' in body):
                response_shape = 'paginated'
                break
            if isinstance(body, dict):
                response_shape = 'object'
                # don't break — keep looking for clearer signal

    # auth flow inference: cookie-only vs Bearer-mint vs CSRF
    if bearer_tokens:
        auth_flow = 'bearer-mint'
    elif has_csrf_header:
        auth_flow = 'csrf'
    elif session_cookies:
        auth_flow = 'cookie'
    else:
        auth_flow = 'unknown'

    # --- #3: padrões de cliente (proxy-envelope, GraphQL) ---
    is_proxy, proxy_info = detect_proxy_envelope(entries, main_host) if main_host else (False, {})
    graphql = detect_graphql(entries, main_host) if main_host else {'is_graphql': False}
    client_pattern = 'proxy-envelope' if is_proxy else ('graphql' if graphql.get('is_graphql') else 'rest')

    # --- #4: cookie de clearance do Cloudflare habilita o modo Surf ---
    has_clearance_cookie = any(CLOUDFLARE_COOKIE.match(n) for n in session_cookies)

    # Decisão de modo (3 tiers):
    #   cdp   → precisa de página VIVA: CSRF rotativo OU bearer-mint (token no DOM que rotaciona)
    #   surf  → Cloudflare bloqueia por TLS fingerprint, mas SEM csrf/bearer → curl_cffi impersonando
    #           Chrome + cookies (incl. cf_clearance) replica SEM browser aberto
    #   simple→ sem proteção → curl normal + cookies
    if has_csrf_header or auth_flow == 'bearer-mint':
        recommended_mode = 'cdp'
    elif has_cloudflare:
        recommended_mode = 'surf'
    else:
        recommended_mode = 'simple'

    result = {
        'hosts': sorted(hosts_seen),
        'main_host': main_host,
        'recommended_mode': recommended_mode,
        'detection': {
            'has_cloudflare': has_cloudflare,
            'has_clearance_cookie': has_clearance_cookie,
            'has_csrf_header': has_csrf_header,
            'has_bearer': bool(bearer_tokens),
            'auth_flow': auth_flow,
            'auth_provider': auth_provider,
            'auth_audience': auth_audience,
            'response_shape': response_shape,
            'client_pattern': client_pattern,
            'proxy_envelope': proxy_info if is_proxy else None,
            'graphql': graphql if graphql.get('is_graphql') else None,
            'reason': (
                'CSRF rotativo (X-CSRF-TOKEN) — token muda a cada request, precisa ler do DOM → CDP'
                if has_csrf_header else
                'Bearer JWT mintado pelo frontend — token rotativo, reusar a aba → CDP'
                if auth_flow == 'bearer-mint' else
                ('Cloudflare (bloqueio por TLS fingerprint) — curl_cffi impersonando Chrome + cf_clearance replica sem browser → Surf'
                 + ('' if has_clearance_cookie else ' (⚠ cf_clearance não veio no HAR — recapture com o cookie, ou caia pra CDP)'))
                if has_cloudflare else
                'Sem Cloudflare/CSRF/Bearer — curl com cookies funciona → simple'
            ),
            'mint_endpoint': mint_endpoint,
        },
        'endpoints': [],
        'auth': {
            'session_cookies': session_cookies,
            'csrf_token': csrf_token,
            'cookie_expiry_seconds': cookie_expiry,
            'bearer_sample_payload': decode_jwt(bearer_tokens[0])[1] if bearer_tokens else None,
        }
    }

    for key, ep in sorted(endpoints.items(), key=lambda x: (-x[1]['count'], x[0])):
        result['endpoints'].append({
            'method': ep['method'],
            'host': ep['host'],
            'path': ep['path_template'],
            'example': ep['example_path'],
            'status_codes': sorted(ep['status_codes']),
            'query_params': ep['query_params'],
            'body_fields': ep['body_fields'],
            'body_sample': ep['body_sample'],
            'is_third_party': ep['is_third_party'],
            'requires_auth': ep['requires_auth'],
            'calls': ep['count'],
        })

    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('har_file')
    parser.add_argument('--host', default=None, help='Filter by host (e.g. mysite.com)')
    args = parser.parse_args()

    result = parse_har(args.har_file, args.host)
    print(json.dumps(result, indent=2))
