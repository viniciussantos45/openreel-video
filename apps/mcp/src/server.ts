#!/usr/bin/env node
/**
 * OpenReel MCP Server — entry point
 *
 * Exposes all OpenReel video editing capabilities as MCP tools over stdio.
 * Compatible with Claude Code, Cursor, VS Code Copilot, and Codex.
 *
 * Usage:
 *   npx tsx src/server.ts [--project /path/to/file.openreel]
 *   node dist/server.js [--project /path/to/file.openreel]
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { store } from "./project-store.js";
import { registerProjectTools } from "./tools/project.js";
import { registerMediaTools } from "./tools/media.js";
import { registerTimelineTools } from "./tools/timeline.js";
import { registerTrackTools } from "./tools/tracks.js";
import { registerClipTools } from "./tools/clips.js";
import { registerEffectTools } from "./tools/effects.js";
import { registerTransformTools } from "./tools/transform.js";
import { registerKeyframeTools } from "./tools/keyframes.js";
import { registerTransitionTools } from "./tools/transitions.js";
import { registerAudioTools } from "./tools/audio.js";
import { registerSubtitleTools } from "./tools/subtitles.js";
import { registerTextTools } from "./tools/text.js";
import { registerGraphicsTools } from "./tools/graphics.js";
import { registerMarkerTools } from "./tools/markers.js";
import { registerExportTools } from "./tools/export.js";
import { registerTemplateTools } from "./tools/templates.js";

async function main() {
  // Parse CLI args: --project <path>
  const args = process.argv.slice(2);
  const projectIdx = args.indexOf("--project");
  if (projectIdx !== -1 && args[projectIdx + 1]) {
    const projectPath = args[projectIdx + 1];
    try {
      await store.loadFromFile(projectPath);
      process.stderr.write(`[openreel-mcp] Loaded project: ${projectPath}\n`);
    } catch (err) {
      process.stderr.write(`[openreel-mcp] Warning: could not load project at ${projectPath}: ${err}\n`);
    }
  }

  const server = new McpServer({
    name: "openreel-mcp",
    version: "0.1.0",
  });

  // Register all tool categories
  registerProjectTools(server);
  registerMediaTools(server);
  registerTimelineTools(server);
  registerTrackTools(server);
  registerClipTools(server);
  registerEffectTools(server);
  registerTransformTools(server);
  registerKeyframeTools(server);
  registerTransitionTools(server);
  registerAudioTools(server);
  registerSubtitleTools(server);
  registerTextTools(server);
  registerGraphicsTools(server);
  registerMarkerTools(server);
  registerExportTools(server);
  registerTemplateTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write("[openreel-mcp] Server ready — listening on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`[openreel-mcp] Fatal error: ${err}\n`);
  process.exit(1);
});
