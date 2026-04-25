import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

const TEXT_ANIMATION_PRESETS = [
  "none",
  "typewriter",
  "fade",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "scale",
  "blur",
  "bounce",
  "rotate",
  "wave",
  "shake",
  "pop",
  "glitch",
  "split",
  "flip",
  "word-by-word",
  "rainbow",
] as const;

const textStyleSchema = z
  .object({
    fontFamily: z.string().optional(),
    fontSize: z.number().positive().optional(),
    fontWeight: z
      .union([
        z.enum(["100", "200", "300", "400", "500", "600", "700", "800", "900"]).transform(Number),
        z.enum(["normal", "bold"]),
      ])
      .optional(),
    fontStyle: z.enum(["normal", "italic"]).optional(),
    color: z.string().optional().describe("CSS color string, e.g. '#ffffff'"),
    backgroundColor: z.string().optional(),
    strokeColor: z.string().optional(),
    strokeWidth: z.number().min(0).optional(),
    shadowColor: z.string().optional(),
    shadowBlur: z.number().min(0).optional(),
    shadowOffsetX: z.number().optional(),
    shadowOffsetY: z.number().optional(),
    textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
    verticalAlign: z.enum(["top", "middle", "bottom"]).optional(),
    lineHeight: z.number().positive().optional(),
    letterSpacing: z.number().optional(),
    textDecoration: z.enum(["none", "underline", "line-through", "overline"]).optional(),
  })
  .describe("Text style properties");

export function registerTextTools(server: McpServer): void {
  server.tool(
    "list_text_clips",
    "List all text clips in the project.",
    {},
    async () =>
      run(() => {
        const p = store.getProject();
        return (p.textClips ?? []).map((tc) => ({
          id: tc.id,
          trackId: tc.trackId,
          startTime: tc.startTime,
          duration: tc.duration,
          text: tc.text,
          style: tc.style,
          animation: tc.animation,
        }));
      }),
  );

  server.tool(
    "add_text_clip",
    "Add a text clip to a text track. Returns the new text clip's ID.",
    {
      trackId: z.string().describe("ID of the text track (must have type 'text')"),
      startTime: z.number().min(0).describe("Start time in seconds"),
      duration: z.number().positive().describe("Duration in seconds"),
      text: z.string().min(1).describe("Text content"),
      style: textStyleSchema.optional().describe("Optional text style overrides"),
    },
    async ({ trackId, startTime, duration, text, style }) =>
      run(() => {
        const id = store.addTextClip(trackId, startTime, duration, text, style);
        return { id, trackId, startTime, duration, text };
      }),
  );

  server.tool(
    "update_text_clip",
    "Update the text content and/or style of an existing text clip.",
    {
      clipId: z.string().describe("ID of the text clip"),
      text: z.string().optional().describe("New text content (omit to keep existing)"),
      style: textStyleSchema.optional().describe("Style properties to update (partial)"),
    },
    async ({ clipId, text, style }) =>
      run(() => {
        store.updateTextClip(clipId, text, style);
        return { updated: true, clipId };
      }),
  );

  server.tool(
    "list_text_animation_presets",
    "List all available text animation presets.",
    {},
    async () =>
      run(() =>
        TEXT_ANIMATION_PRESETS.map((preset) => ({
          id: preset,
          description:
            preset === "none" ? "No animation" :
            preset === "typewriter" ? "Characters appear one-by-one like typing" :
            preset === "fade" ? "Text fades in/out" :
            preset === "slide-left" ? "Text slides in from the right" :
            preset === "slide-right" ? "Text slides in from the left" :
            preset === "slide-up" ? "Text slides in from below" :
            preset === "slide-down" ? "Text slides in from above" :
            preset === "scale" ? "Text scales from small to large" :
            preset === "blur" ? "Text fades in from a blurred state" :
            preset === "bounce" ? "Text bounces into place" :
            preset === "rotate" ? "Text rotates into position" :
            preset === "wave" ? "Characters wave sequentially" :
            preset === "shake" ? "Text shakes/vibrates" :
            preset === "pop" ? "Text pops in with overshoot" :
            preset === "glitch" ? "Digital glitch effect" :
            preset === "split" ? "Text splits apart" :
            preset === "flip" ? "Text flips on an axis" :
            preset === "word-by-word" ? "Words appear one at a time" :
            "Rainbow colour cycling",
        })),
      ),
  );
}
