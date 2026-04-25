import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { run } from "../utils/response.js";
import { BUILTIN_TEMPLATES, TEMPLATE_CATEGORIES } from "../constants.js";

export function registerTemplateTools(server: McpServer): void {
  server.tool(
    "list_templates",
    "List all built-in project templates with their categories, descriptions, and placeholder requirements.",
    {},
    async () =>
      run(() => ({
        categories: TEMPLATE_CATEGORIES,
        templates: BUILTIN_TEMPLATES.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          description: t.description,
          settings: t.settings,
          placeholderCount: t.placeholders.length,
        })),
      })),
  );

  server.tool(
    "get_template_details",
    "Get full details for a specific template, including all placeholders and their constraints.",
    {
      templateId: z.string().describe("ID of the template"),
    },
    async ({ templateId }) =>
      run(() => {
        const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
        if (!template) throw new Error(`Template not found: ${templateId}`);
        return template;
      }),
  );
}
