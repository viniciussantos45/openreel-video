import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

export function registerProjectTools(server: McpServer): void {
  server.tool(
    "get_project_info",
    "Get the current project's name, settings (resolution, frame rate, sample rate), duration, track count, and media count.",
    {},
    async () =>
      run(() => {
        const p = store.getProject();
        return {
          id: p.id,
          name: p.name,
          createdAt: new Date(p.createdAt).toISOString(),
          modifiedAt: new Date(p.modifiedAt).toISOString(),
          filePath: store.getCurrentFilePath(),
          settings: p.settings,
          duration: p.timeline.duration,
          trackCount: p.timeline.tracks.length,
          mediaCount: p.mediaLibrary.items.length,
          subtitleCount: p.timeline.subtitles.length,
          markerCount: p.timeline.markers.length,
        };
      }),
  );

  server.tool(
    "create_project",
    "Create a new empty project, replacing the current in-memory project. Unsaved changes to the previous project will be lost.",
    {
      name: z.string().min(1).describe("Project name"),
      width: z.number().int().positive().default(1920).describe("Canvas width in pixels"),
      height: z.number().int().positive().default(1080).describe("Canvas height in pixels"),
      frameRate: z.number().positive().default(30).describe("Frame rate (fps)"),
      sampleRate: z.number().int().positive().default(48000).describe("Audio sample rate (Hz)"),
      channels: z.number().int().min(1).max(2).default(2).describe("Audio channels (1=mono, 2=stereo)"),
    },
    async ({ name, width, height, frameRate, sampleRate, channels }) =>
      run(() => {
        const p = store.createProject(name, { width, height, frameRate, sampleRate, channels });
        return { id: p.id, name: p.name, settings: p.settings };
      }),
  );

  server.tool(
    "update_project_settings",
    "Update project settings such as resolution, frame rate, or audio sample rate.",
    {
      width: z.number().int().positive().optional().describe("Canvas width in pixels"),
      height: z.number().int().positive().optional().describe("Canvas height in pixels"),
      frameRate: z.number().positive().optional().describe("Frame rate (fps)"),
      sampleRate: z.number().int().positive().optional().describe("Audio sample rate (Hz)"),
      channels: z.number().int().min(1).max(2).optional().describe("Audio channels"),
    },
    async (args) =>
      run(() => {
        const p = store.updateSettings(args);
        return { settings: p.settings };
      }),
  );

  server.tool(
    "load_project",
    "Load a .openreel project file from disk into memory. This replaces the current in-memory project.",
    {
      filePath: z.string().describe("Absolute path to the .openreel JSON file"),
    },
    async ({ filePath }) =>
      run(async () => {
        await store.loadFromFile(filePath);
        const p = store.getProject();
        return {
          loaded: true,
          id: p.id,
          name: p.name,
          settings: p.settings,
          duration: p.timeline.duration,
          trackCount: p.timeline.tracks.length,
          mediaCount: p.mediaLibrary.items.length,
        };
      }),
  );

  server.tool(
    "save_project",
    "Save the current in-memory project to a .openreel JSON file on disk.",
    {
      filePath: z
        .string()
        .optional()
        .describe(
          "Absolute path to save the file. If omitted, saves to the path it was loaded from. Required for new projects.",
        ),
    },
    async ({ filePath }) =>
      run(async () => {
        const savedPath = await store.saveToFile(filePath);
        return { saved: true, filePath: savedPath };
      }),
  );
}
