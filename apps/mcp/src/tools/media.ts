import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { basename } from "node:path";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

export function registerMediaTools(server: McpServer): void {
  server.tool(
    "list_media",
    "List all media items in the project's media library (videos, audio files, images).",
    {},
    async () =>
      run(() => {
        const p = store.getProject();
        return p.mediaLibrary.items.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          isPlaceholder: item.isPlaceholder ?? false,
          duration: item.metadata.duration,
          width: item.metadata.width,
          height: item.metadata.height,
          frameRate: item.metadata.frameRate,
          sampleRate: item.metadata.sampleRate,
          fileSize: item.metadata.fileSize,
          thumbnailUrl: item.thumbnailUrl,
          sourceFile: item.sourceFile,
        }));
      }),
  );

  server.tool(
    "get_media_info",
    "Get detailed metadata for a specific media item.",
    {
      mediaId: z.string().describe("The ID of the media item"),
    },
    async ({ mediaId }) =>
      run(() => {
        const p = store.getProject();
        const item = p.mediaLibrary.items.find((m) => m.id === mediaId);
        if (!item) throw new Error(`Media not found: ${mediaId}`);
        return item;
      }),
  );

  server.tool(
    "import_media",
    "Register a media file as a placeholder in the media library. The web app will re-link the actual file on next open. Returns the new media ID.",
    {
      filePath: z.string().describe("Absolute path to the media file on disk"),
      name: z.string().optional().describe("Optional display name. Defaults to the file's basename."),
      type: z
        .enum(["video", "audio", "image"])
        .describe("Media type: video, audio, or image"),
    },
    async ({ filePath, name, type }) =>
      run(() => {
        const displayName = name ?? basename(filePath);
        store.addMediaPlaceholder(filePath, displayName, type);
        const p = store.getProject();
        const added = p.mediaLibrary.items[p.mediaLibrary.items.length - 1];
        return { id: added.id, name: added.name, type: added.type, isPlaceholder: true, filePath };
      }),
  );

  server.tool(
    "rename_media",
    "Rename a media item in the library.",
    {
      mediaId: z.string().describe("The ID of the media item"),
      name: z.string().min(1).describe("New display name"),
    },
    async ({ mediaId, name }) =>
      run(() => {
        store.renameMedia(mediaId, name);
        return { renamed: true, mediaId, name };
      }),
  );

  server.tool(
    "delete_media",
    "Delete a media item from the library. Clips referencing this media will keep their mediaId but become broken.",
    {
      mediaId: z.string().describe("The ID of the media item to delete"),
    },
    async ({ mediaId }) =>
      run(() => {
        store.deleteMedia(mediaId);
        return { deleted: true, mediaId };
      }),
  );
}
