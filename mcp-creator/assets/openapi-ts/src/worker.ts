// Destino Cloudflare: MCP remoto. O token chega no cabeçalho do conector e é repassado para a API.
import { createMcpHandler } from "agents/mcp/server";
import { createServer } from "./tools";

type Env = { API_BASE?: string; AUTH_HEADERS?: string };

export default {
  fetch(request, env, ctx) {
    // Cabeçalhos repassados para a API (padrão: Authorization). Ex.: AUTH_HEADERS="x-api-key"
    const nomes = (env.AUTH_HEADERS ?? "authorization").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
    const headers: Record<string, string> = {};
    for (const h of nomes) {
      const v = request.headers.get(h);
      if (v) headers[h] = v;
    }
    return createMcpHandler(() => createServer(headers, env.API_BASE))(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
