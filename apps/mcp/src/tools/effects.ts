import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";
import { EFFECT_DEFINITIONS, getEffectDefinition, getEffectsByCategory } from "../constants.js";
import type { EffectCategory } from "../constants.js";

export function registerEffectTools(server: McpServer): void {
  server.tool(
    "list_effect_definitions",
    "List all available video effect types with their parameter definitions and valid ranges.",
    {},
    async () => run(() => EFFECT_DEFINITIONS),
  );

  server.tool(
    "list_effects_by_category",
    "List video effect definitions filtered by category (blur, color, or stylize).",
    {
      category: z
        .enum(["blur", "color", "stylize"])
        .describe("Effect category to filter by"),
    },
    async ({ category }) =>
      run(() => getEffectsByCategory(category as EffectCategory)),
  );

  server.tool(
    "get_clip_effects",
    "Get all video effects currently applied to a clip, including their parameters.",
    {
      clipId: z.string().describe("ID of the clip"),
    },
    async ({ clipId }) =>
      run(() => {
        const p = store.getProject();
        for (const track of p.timeline.tracks) {
          const clip = track.clips.find((c) => c.id === clipId);
          if (clip) {
            return clip.effects.map((e) => ({
              id: e.id,
              type: e.type,
              enabled: e.enabled,
              params: e.params,
              definition: getEffectDefinition(e.type as Parameters<typeof getEffectDefinition>[0]),
            }));
          }
        }
        throw new Error(`Clip not found: ${clipId}`);
      }),
  );

  server.tool(
    "add_effect",
    "Apply a video effect to a clip. Returns the new effect's ID.",
    {
      clipId: z.string().describe("ID of the clip"),
      effectType: z
        .enum([
          "blur",
          "shadow",
          "glow",
          "brightness",
          "contrast",
          "saturation",
          "hue-saturation",
          "color-balance",
          "curves",
          "motion-blur",
          "radial-blur",
          "vignette",
          "film-grain",
          "chromatic-aberration",
        ])
        .describe("Type of effect to apply"),
      params: z
        .record(z.number())
        .optional()
        .describe(
          "Initial parameter values. Use list_effect_definitions to see available parameters and their ranges.",
        ),
    },
    async ({ clipId, effectType, params }) =>
      run(() => {
        const effectId = store.addEffect(clipId, effectType, params as Record<string, unknown>);
        return { effectId, clipId, effectType };
      }),
  );

  server.tool(
    "remove_effect",
    "Remove a video effect from a clip.",
    {
      clipId: z.string().describe("ID of the clip"),
      effectId: z.string().describe("ID of the effect to remove"),
    },
    async ({ clipId, effectId }) =>
      run(() => {
        store.removeEffect(clipId, effectId);
        return { removed: true, clipId, effectId };
      }),
  );

  server.tool(
    "update_effect",
    "Update the parameters of a video effect on a clip.",
    {
      clipId: z.string().describe("ID of the clip"),
      effectId: z.string().describe("ID of the effect"),
      params: z
        .record(z.number())
        .describe("Parameter key/value pairs to update. Unspecified params remain unchanged."),
    },
    async ({ clipId, effectId, params }) =>
      run(() => {
        store.updateEffect(clipId, effectId, params as Record<string, unknown>);
        return { updated: true, clipId, effectId, params };
      }),
  );

  server.tool(
    "reorder_effect",
    "Change the render order of a video effect within a clip's effect stack.",
    {
      clipId: z.string().describe("ID of the clip"),
      effectId: z.string().describe("ID of the effect to reorder"),
      newIndex: z.number().int().min(0).describe("New zero-based index in the effect stack"),
    },
    async ({ clipId, effectId, newIndex }) =>
      run(() => {
        store.reorderEffect(clipId, effectId, newIndex);
        return { reordered: true, clipId, effectId, newIndex };
      }),
  );
}
