import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

export function registerMarkerTools(server: McpServer): void {
  server.tool(
    "list_markers",
    "List all timeline markers with their time, label, and colour.",
    {},
    async () =>
      run(() => {
        const p = store.getProject();
        return p.timeline.markers;
      }),
  );

  server.tool(
    "add_marker",
    "Add a marker to the timeline at the specified time. Returns the new marker's ID.",
    {
      time: z.number().min(0).describe("Marker position in seconds"),
      label: z.string().default("").describe("Marker label text"),
      color: z.string().default("#f59e0b").describe("Marker colour as a CSS colour string (e.g. '#ff0000')"),
    },
    async ({ time, label, color }) =>
      run(() => {
        const id = store.addMarker(time, label, color);
        return { id, time, label, color };
      }),
  );

  server.tool(
    "remove_marker",
    "Remove a marker from the timeline.",
    {
      markerId: z.string().describe("ID of the marker to remove"),
    },
    async ({ markerId }) =>
      run(() => {
        store.removeMarker(markerId);
        return { removed: true, markerId };
      }),
  );
}
