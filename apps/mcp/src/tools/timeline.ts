import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

export function registerTimelineTools(server: McpServer): void {
  server.tool(
    "get_timeline",
    "Get the full timeline structure: all tracks, clips, transitions, markers, subtitles, and duration.",
    {},
    async () =>
      run(() => {
        const p = store.getProject();
        return p.timeline;
      }),
  );

  server.tool(
    "get_timeline_summary",
    "Get a compact summary of the timeline: track list with clip counts and total duration per track.",
    {},
    async () =>
      run(() => {
        const p = store.getProject();
        const tracks = p.timeline.tracks.map((t) => {
          const totalClipDuration = t.clips.reduce((sum, c) => sum + c.duration, 0);
          const trackEnd = t.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
          return {
            id: t.id,
            name: t.name,
            type: t.type,
            clipCount: t.clips.length,
            transitionCount: t.transitions.length,
            totalClipDuration,
            trackEnd,
            locked: t.locked,
            hidden: t.hidden,
            muted: t.muted,
            solo: t.solo,
          };
        });
        return {
          duration: p.timeline.duration,
          trackCount: tracks.length,
          subtitleCount: p.timeline.subtitles.length,
          markerCount: p.timeline.markers.length,
          tracks,
        };
      }),
  );
}
