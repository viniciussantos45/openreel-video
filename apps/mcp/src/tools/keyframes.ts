import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";
import type { EasingType } from "../types.js";

const EASING_VALUES = [
  "linear",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "bezier",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutQuad",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutCubic",
  "easeInQuart",
  "easeOutQuart",
  "easeInOutQuart",
  "easeInQuint",
  "easeOutQuint",
  "easeInOutQuint",
  "easeInSine",
  "easeOutSine",
  "easeInOutSine",
  "easeInExpo",
  "easeOutExpo",
  "easeInOutExpo",
  "easeInCirc",
  "easeOutCirc",
  "easeInOutCirc",
  "easeInBack",
  "easeOutBack",
  "easeInOutBack",
  "easeInElastic",
  "easeOutElastic",
  "easeInOutElastic",
  "easeInBounce",
  "easeOutBounce",
  "easeInOutBounce",
] as const;

export function registerKeyframeTools(server: McpServer): void {
  server.tool(
    "list_keyframes",
    "List keyframes on a clip, optionally filtered by property name.",
    {
      clipId: z.string().describe("ID of the clip"),
      property: z
        .string()
        .optional()
        .describe("Property name to filter by (e.g. 'opacity', 'transform.position.x'). Lists all if omitted."),
    },
    async ({ clipId, property }) =>
      run(() => {
        const p = store.getProject();
        for (const track of p.timeline.tracks) {
          const clip = track.clips.find((c) => c.id === clipId);
          if (clip) {
            const kfs = property
              ? clip.keyframes.filter((k) => k.property === property)
              : clip.keyframes;
            return kfs.map((k) => ({ id: k.id, property: k.property, time: k.time, value: k.value, easing: k.easing }));
          }
        }
        throw new Error(`Clip not found: ${clipId}`);
      }),
  );

  server.tool(
    "add_keyframe",
    "Add a keyframe to a clip property at the given time.",
    {
      clipId: z.string().describe("ID of the clip"),
      property: z
        .string()
        .describe("Property to animate (e.g. 'opacity', 'transform.scale.x', 'volume')"),
      time: z.number().min(0).describe("Time in seconds (relative to clip start)"),
      value: z.unknown().describe("The value at this keyframe"),
      easing: z
        .enum(EASING_VALUES)
        .optional()
        .default("linear")
        .describe("Easing curve from this keyframe to the next"),
    },
    async ({ clipId, property, time, value, easing }) =>
      run(() => {
        store.addKeyframe(clipId, property, time, value, easing as EasingType);
        return { added: true, clipId, property, time, value, easing };
      }),
  );

  server.tool(
    "remove_keyframe",
    "Remove a keyframe from a clip at the specified property and time.",
    {
      clipId: z.string().describe("ID of the clip"),
      property: z.string().describe("Property name"),
      time: z.number().min(0).describe("Keyframe time in seconds"),
    },
    async ({ clipId, property, time }) =>
      run(() => {
        store.removeKeyframe(clipId, property, time);
        return { removed: true, clipId, property, time };
      }),
  );

  server.tool(
    "update_keyframe",
    "Update the value and/or easing of an existing keyframe.",
    {
      clipId: z.string().describe("ID of the clip"),
      property: z.string().describe("Property name"),
      time: z.number().min(0).describe("Keyframe time in seconds"),
      value: z.unknown().optional().describe("New value (omit to keep existing)"),
      easing: z
        .enum(EASING_VALUES)
        .optional()
        .describe("New easing curve (omit to keep existing)"),
    },
    async ({ clipId, property, time, value, easing }) =>
      run(() => {
        store.updateKeyframe(clipId, property, time, value, easing as EasingType | undefined);
        return { updated: true, clipId, property, time };
      }),
  );

  server.tool(
    "list_easing_types",
    "List all available easing type names for keyframe animation.",
    {},
    async () => run(() => EASING_VALUES),
  );
}
