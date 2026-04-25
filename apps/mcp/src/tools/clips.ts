import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

export function registerClipTools(server: McpServer): void {
  server.tool(
    "list_clips",
    "List clips in the timeline. Optionally filter by track ID.",
    {
      trackId: z
        .string()
        .optional()
        .describe("If provided, only return clips from this track"),
    },
    async ({ trackId }) =>
      run(() => {
        const p = store.getProject();
        const tracks = trackId
          ? p.timeline.tracks.filter((t) => t.id === trackId)
          : p.timeline.tracks;
        return tracks.flatMap((t) =>
          t.clips.map((c) => ({
            id: c.id,
            trackId: c.trackId,
            trackName: t.name,
            trackType: t.type,
            mediaId: c.mediaId,
            startTime: c.startTime,
            duration: c.duration,
            inPoint: c.inPoint,
            outPoint: c.outPoint,
            volume: c.volume,
            effectCount: c.effects.length,
            audioEffectCount: c.audioEffects.length,
            keyframeCount: c.keyframes.length,
          })),
        );
      }),
  );

  server.tool(
    "add_clip",
    "Add a media clip to a track at the specified time. Returns the new clip's ID.",
    {
      trackId: z.string().describe("ID of the target track"),
      mediaId: z.string().describe("ID of the media item to place"),
      startTime: z.number().min(0).describe("Start time in seconds on the timeline"),
    },
    async ({ trackId, mediaId, startTime }) =>
      run(() => {
        const clip = store.addClip(trackId, mediaId, startTime);
        return {
          id: clip.id,
          trackId: clip.trackId,
          mediaId: clip.mediaId,
          startTime: clip.startTime,
          duration: clip.duration,
        };
      }),
  );

  server.tool(
    "remove_clip",
    "Remove a clip from the timeline.",
    {
      clipId: z.string().describe("ID of the clip to remove"),
    },
    async ({ clipId }) =>
      run(() => {
        store.removeClip(clipId);
        return { removed: true, clipId };
      }),
  );

  server.tool(
    "move_clip",
    "Move a clip to a new start time and/or to a different track.",
    {
      clipId: z.string().describe("ID of the clip to move"),
      startTime: z.number().min(0).describe("New start time in seconds"),
      trackId: z
        .string()
        .optional()
        .describe("Target track ID. If omitted, the clip stays on its current track."),
    },
    async ({ clipId, startTime, trackId }) =>
      run(() => {
        store.moveClip(clipId, startTime, trackId);
        return { moved: true, clipId, startTime, trackId };
      }),
  );

  server.tool(
    "trim_clip",
    "Trim a clip's in-point and/or out-point to change which part of the source media is shown.",
    {
      clipId: z.string().describe("ID of the clip to trim"),
      inPoint: z
        .number()
        .min(0)
        .optional()
        .describe("New in-point in seconds (start of the used portion within the source)"),
      outPoint: z
        .number()
        .min(0)
        .optional()
        .describe("New out-point in seconds (end of the used portion within the source)"),
    },
    async ({ clipId, inPoint, outPoint }) =>
      run(() => {
        store.trimClip(clipId, inPoint, outPoint);
        return { trimmed: true, clipId, inPoint, outPoint };
      }),
  );

  server.tool(
    "split_clip",
    "Split a clip at the specified timeline time, creating two clips. Returns the IDs of both clips.",
    {
      clipId: z.string().describe("ID of the clip to split"),
      time: z.number().min(0).describe("Timeline time in seconds where the split should occur"),
    },
    async ({ clipId, time }) =>
      run(() => {
        const secondClip = store.splitClip(clipId, time);
        return { split: true, firstClipId: clipId, secondClipId: secondClip.id, splitTime: time };
      }),
  );

  server.tool(
    "ripple_delete",
    "Delete a clip and shift all subsequent clips on the same track backwards to close the gap.",
    {
      clipId: z.string().describe("ID of the clip to ripple-delete"),
    },
    async ({ clipId }) =>
      run(() => {
        store.rippleDelete(clipId);
        return { deleted: true, clipId };
      }),
  );
}
