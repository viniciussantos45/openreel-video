import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

export function registerTrackTools(server: McpServer): void {
  server.tool(
    "list_tracks",
    "List all tracks in the timeline with their type, name, clip count, and state flags.",
    {},
    async () =>
      run(() => {
        const p = store.getProject();
        return p.timeline.tracks.map((t, idx) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          position: idx,
          clipCount: t.clips.length,
          transitionCount: t.transitions.length,
          locked: t.locked,
          hidden: t.hidden,
          muted: t.muted,
          solo: t.solo,
        }));
      }),
  );

  server.tool(
    "add_track",
    "Add a new track to the timeline. Returns the new track's ID.",
    {
      trackType: z
        .enum(["video", "audio", "image", "text", "graphics"])
        .describe("Type of track to create"),
      position: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Zero-based insertion position. Defaults to the end of the track list."),
    },
    async ({ trackType, position }) =>
      run(() => {
        const track = store.addTrack(trackType, position);
        return { id: track.id, name: track.name, type: track.type };
      }),
  );

  server.tool(
    "remove_track",
    "Remove a track and all of its clips from the timeline.",
    {
      trackId: z.string().describe("ID of the track to remove"),
    },
    async ({ trackId }) =>
      run(() => {
        store.removeTrack(trackId);
        return { removed: true, trackId };
      }),
  );

  server.tool(
    "reorder_track",
    "Move a track to a new position in the track stack.",
    {
      trackId: z.string().describe("ID of the track to move"),
      newPosition: z.number().int().min(0).describe("New zero-based position"),
    },
    async ({ trackId, newPosition }) =>
      run(() => {
        store.reorderTrack(trackId, newPosition);
        return { reordered: true, trackId, newPosition };
      }),
  );

  server.tool(
    "set_track_locked",
    "Lock or unlock a track to prevent accidental edits.",
    {
      trackId: z.string().describe("ID of the track"),
      locked: z.boolean().describe("true to lock, false to unlock"),
    },
    async ({ trackId, locked }) =>
      run(() => {
        store.setTrackLocked(trackId, locked);
        return { trackId, locked };
      }),
  );

  server.tool(
    "set_track_visibility",
    "Set the hidden, muted, and/or solo state of a track. Provide only the flags you want to change.",
    {
      trackId: z.string().describe("ID of the track"),
      hidden: z.boolean().optional().describe("true to hide the track during export/preview"),
      muted: z.boolean().optional().describe("true to mute audio on this track"),
      solo: z.boolean().optional().describe("true to solo this track (mutes all others)"),
    },
    async ({ trackId, hidden, muted, solo }) =>
      run(() => {
        store.setTrackVisibility(trackId, { hidden, muted, solo });
        return { trackId, hidden, muted, solo };
      }),
  );
}
