// Núcleo compartilhado: OpenAPI (spec.json) → McpServer com uma tool por operação.
// Usado pelos 3 destinos: worker.ts (Cloudflare), stdio.ts (local e .mcpb).
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import spec from "./spec.json";

type Param = { name: string; in: string; required?: boolean; description?: string; schema?: any };

const METODOS = ["get", "post", "put", "patch", "delete"];
const s: any = spec;

const resolver = (x: any): any => {
  if (!x?.$ref) return x;
  return x.$ref.replace(/^#\//, "").split("/").reduce((o: any, k: string) => o?.[k], s);
};

const zodDe = (sch: any = {}, desc?: string): z.ZodTypeAny => {
  sch = resolver(sch) ?? {};
  let t: z.ZodTypeAny;
  const tipo = Array.isArray(sch.type) ? sch.type.find((x: string) => x !== "null") : sch.type;
  if (sch.enum?.length && sch.enum.every((v: any) => typeof v === "string")) t = z.enum(sch.enum as [string, ...string[]]);
  else if (tipo === "integer" || tipo === "number") t = z.number();
  else if (tipo === "boolean") t = z.boolean();
  else if (tipo === "array") t = z.array(z.any());
  else if (tipo === "object") t = z.record(z.string(), z.any());
  else if (tipo === "string") t = z.string();
  else t = z.any();
  const d = desc ?? sch.description;
  return d ? t.describe(d.slice(0, 500)) : t;
};

const nomeTool = (id: string) =>
  id.replace(/\{[^}]+\}/g, "by").replace(/\bv\d+\b/g, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 64);

export const nomeApi: string = s.info?.title ?? "api";

export function createServer(headers: Record<string, string>, apiBase?: string) {
  const server = new McpServer({ name: nomeApi, version: s.info?.version ?? "1.0.0" });
  const base = (apiBase ?? s.servers?.[0]?.url ?? "").replace(/\/$/, "");
  const usados = new Set<string>();

  for (const [caminho, item] of Object.entries<any>(s.paths ?? {})) {
    for (const metodo of METODOS) {
      const op = item[metodo];
      if (!op) continue;
      const params: Param[] = [...(item.parameters ?? []), ...(op.parameters ?? [])].map(resolver);
      const corpo = resolver(resolver(op.requestBody)?.content?.["application/json"]?.schema);
      const props = resolver(corpo)?.properties ?? {};
      const obrigCorpo = new Set<string>(resolver(corpo)?.required ?? []);

      const input: Record<string, z.ZodTypeAny> = {};
      for (const p of params) {
        if (p.in !== "path" && p.in !== "query") continue;
        const t = zodDe(p.schema, p.description);
        input[p.name] = p.required || p.in === "path" ? t : t.optional();
      }
      const camposCorpo: string[] = [];
      for (const [k, v] of Object.entries<any>(props)) {
        if (input[k]) continue;
        camposCorpo.push(k);
        input[k] = obrigCorpo.has(k) ? zodDe(v) : zodDe(v).optional();
      }
      if (corpo && !Object.keys(props).length) input.body = z.record(z.string(), z.any()).optional().describe("Corpo JSON da requisição");

      let nome = nomeTool(op.operationId ?? `${metodo}_${caminho}`);
      while (usados.has(nome)) nome = nomeTool(nome + "_");
      usados.add(nome);

      server.registerTool(
        nome,
        { description: [op.summary, op.description].filter(Boolean).join(" — ").slice(0, 1000) || `${metodo.toUpperCase()} ${caminho}`, inputSchema: input },
        async (args: Record<string, any>) => {
          const url = new URL(base + caminho.replace(/\{([^}]+)\}/g, (_, n) => encodeURIComponent(String(args[n] ?? ""))));
          for (const p of params) if (p.in === "query" && args[p.name] !== undefined) url.searchParams.set(p.name, String(args[p.name]));
          let body: string | undefined;
          if (corpo) {
            const b = Object.keys(props).length ? Object.fromEntries(camposCorpo.filter((k) => args[k] !== undefined).map((k) => [k, args[k]])) : args.body ?? {};
            body = JSON.stringify(b);
          }
          const res = await fetch(url, { method: metodo.toUpperCase(), headers: { Accept: "application/json", ...headers, ...(body ? { "Content-Type": "application/json" } : {}) }, body });
          const text = await res.text();
          return { content: [{ type: "text" as const, text: res.ok ? text : `Erro ${res.status}: ${text}` }], isError: !res.ok };
        }
      );
    }
  }
  return server;
}
