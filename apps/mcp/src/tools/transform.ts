import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

const vec2Schema = z
  .object({ x: z.number(), y: z.number() })
  .describe("2D vector with x and y components");

export function registerTransformTools(server: McpServer): void {
  server.tool(
    "get_clip_transform",
    "Get the spatial transform of a clip: position, scale, rotation, anchor point, opacity, and optional 3D/crop settings.",
    {
      clipId: z.string().describe("ID of the clip (or text/shape clip)"),
    },
    async ({ clipId }) =>
      run(() => {
        const p = store.getProject();
        // Regular clips
        for (const track of p.timeline.tracks) {
          const clip = track.clips.find((c) => c.id === clipId);
          if (clip) return clip.transform;
        }
        // Text clips
        for (const tc of p.textClips ?? []) {
          if (tc.id === clipId) return tc.transform;
        }
        // Shape clips
        for (const sc of p.shapeClips ?? []) {
          if (sc.id === clipId) return sc.transform;
        }
        throw new Error(`Clip not found: ${clipId}`);
      }),
  );

  server.tool(
    "update_transform",
    "Update the spatial transform of a clip. Provide only the properties you want to change.",
    {
      clipId: z.string().describe("ID of the clip (or text/shape clip)"),
      position: vec2Schema
        .optional()
        .describe("Normalized position (0–1) relative to canvas. {x:0.5,y:0.5} = center."),
      scale: vec2Schema
        .optional()
        .describe("Scale multiplier. {x:1,y:1} = original size."),
      rotation: z
        .number()
        .optional()
        .describe("Rotation in degrees (clockwise)"),
      anchor: vec2Schema
        .optional()
        .describe("Normalized anchor point for rotation/scale. {x:0.5,y:0.5} = center."),
      opacity: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("Opacity from 0 (transparent) to 1 (fully opaque)"),
      borderRadius: z
        .number()
        .min(0)
        .optional()
        .describe("Border radius in pixels for rounded corners"),
      fitMode: z
        .enum(["contain", "cover", "stretch", "none"])
        .optional()
        .describe("How the media fits within its bounds"),
      crop: z
        .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
        .optional()
        .describe("Crop rectangle as normalized values (0–1)"),
      perspective: z
        .number()
        .optional()
        .describe("CSS perspective distance for 3D transforms (pixels)"),
    },
    async ({ clipId, ...transform }) =>
      run(() => {
        store.updateTransform(clipId, transform);
        return { updated: true, clipId, transform };
      }),
  );
}
