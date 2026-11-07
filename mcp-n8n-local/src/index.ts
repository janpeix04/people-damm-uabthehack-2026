#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { N8nClient } from "./client.js";
import { executeToolCall, TOOL_DEFINITIONS } from "./tools.js";

const server = new Server(
  {
    name: "mcp-n8n-local",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const n8nClient = new N8nClient();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_DEFINITIONS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return await executeToolCall(name, args, n8nClient);
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[mcp-n8n-local] Error fatal al iniciar servidor MCP: ${message}\n`);
  process.exit(1);
});
