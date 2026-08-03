import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { OpenLoomiToolContext } from "./index";
import { jsonToolResult, withReadyOpenLoomiClient } from "./response";

const memorySourceSchema = z.enum(["memory", "insights", "knowledge"]);

const optionalStringArraySchema = z.array(z.string().min(1)).min(1).optional();

export function registerMemoryTools(
  server: McpServer,
  context: OpenLoomiToolContext,
): void {
  server.registerTool(
    "openloomi_memory_search",
    {
      title: "OpenRice Memory Search",
      description:
        "Search OpenRice unified memory across raw memory, insights, and knowledge-base documents.",
      inputSchema: {
        query: z.string().min(1).describe("Search query."),
        sources: z
          .array(memorySourceSchema)
          .min(1)
          .optional()
          .describe(
            "Optional source filters. Omit to let OpenRice search all memory sources.",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Maximum number of results."),
        threshold: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe("Semantic similarity threshold where supported."),
        botIds: optionalStringArraySchema.describe("Optional bot id filters."),
        documentIds: optionalStringArraySchema.describe(
          "Optional knowledge-base document id filters.",
        ),
        includeArchivedInsights: z
          .boolean()
          .optional()
          .describe("Include archived insights when true."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) =>
      withReadyOpenLoomiClient(
        context,
        "OpenRice memory search failed",
        async (client) => {
          const result = await client.postJson("/api/memory/search", {
            query: args.query,
            sources: args.sources,
            limit: args.limit,
            threshold: args.threshold,
            botIds: args.botIds,
            documentIds: args.documentIds,
            includeArchivedInsights: args.includeArchivedInsights,
          });

          return jsonToolResult("OpenRice memory search result", result, {
            query: args.query,
            result,
          });
        },
      ),
  );

  server.registerTool(
    "openloomi_rag_search",
    {
      title: "OpenRice RAG Search",
      description:
        "Search uploaded OpenRice knowledge-base documents with semantic RAG search.",
      inputSchema: {
        query: z.string().min(1).describe("Knowledge-base search query."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Maximum number of chunks to return."),
        threshold: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe("Semantic similarity threshold."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) =>
      withReadyOpenLoomiClient(
        context,
        "OpenRice RAG search failed",
        async (client) => {
          const result = await client.postJson("/api/rag/search", {
            query: args.query,
            limit: args.limit,
            threshold: args.threshold,
          });

          return jsonToolResult("OpenRice RAG search result", result, {
            query: args.query,
            result,
          });
        },
      ),
  );

  server.registerTool(
    "openloomi_kb_list_documents",
    {
      title: "OpenRice Knowledge Base Documents",
      description:
        "List documents uploaded to the local OpenRice knowledge base.",
      inputSchema: {
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum documents to return."),
        cursor: z
          .string()
          .min(1)
          .optional()
          .describe("Pagination cursor returned by a previous call."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) =>
      withReadyOpenLoomiClient(
        context,
        "OpenRice knowledge-base document listing failed",
        async (client) => {
          const params = new URLSearchParams();
          if (args.pageSize !== undefined) {
            params.set("pageSize", String(args.pageSize));
          }
          if (args.cursor) {
            params.set("cursor", args.cursor);
          }
          const query = params.toString();
          const result = await client.getJson(
            `/api/rag/documents${query ? `?${query}` : ""}`,
          );

          return jsonToolResult("OpenRice knowledge-base documents", result, {
            result,
          });
        },
      ),
  );

  server.registerTool(
    "openloomi_kb_get_document",
    {
      title: "OpenRice Knowledge Base Document",
      description:
        "Read metadata and extracted chunks for one OpenRice knowledge-base document.",
      inputSchema: {
        documentId: z
          .string()
          .min(1)
          .describe("OpenRice knowledge-base document id."),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) =>
      withReadyOpenLoomiClient(
        context,
        "OpenRice knowledge-base document read failed",
        async (client) => {
          const documentId = encodeURIComponent(args.documentId);
          const result = await client.getJson(
            `/api/rag/documents/${documentId}`,
          );

          return jsonToolResult("OpenRice knowledge-base document", result, {
            documentId: args.documentId,
            result,
          });
        },
      ),
  );

  server.registerTool(
    "openloomi_kb_stats",
    {
      title: "OpenRice Knowledge Base Stats",
      description:
        "Read aggregate document and chunk counts for the OpenRice knowledge base.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () =>
      withReadyOpenLoomiClient(
        context,
        "OpenRice knowledge-base stats failed",
        async (client) => {
          const result = await client.getJson("/api/rag/stats");
          return jsonToolResult("OpenRice knowledge-base stats", result);
        },
      ),
  );
}
