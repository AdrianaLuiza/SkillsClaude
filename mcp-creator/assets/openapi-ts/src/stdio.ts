// Destino local (Claude Code) e .mcpb (Claude Desktop): servidor stdio.
// O token vem da variável de ambiente API_TOKEN (no .mcpb, preenchida pelo campo do Claude Desktop).
//   API_AUTH_HEADER  cabeçalho usado (padrão: authorization)
//   API_AUTH_PREFIX  prefixo do valor (padrão: "Bearer "; use "" para chave pura)
//   API_BASE         sobrescreve servers[0].url da spec
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./tools";

const token = process.env.API_TOKEN?.trim();
const header = (process.env.API_AUTH_HEADER ?? "authorization").toLowerCase();
const prefixo = process.env.API_AUTH_PREFIX ?? "Bearer ";
const headers: Record<string, string> = token ? { [header]: prefixo + token } : {};

const server = createServer(headers, process.env.API_BASE || undefined);
await server.connect(new StdioServerTransport());
