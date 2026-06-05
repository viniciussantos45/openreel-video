import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";
import { AUDIO_EFFECT_DEFINITIONS } from "../constants.js";

const automationPointSchema = z.object({
  time: z.number().min(0).describe("Time in seconds"),
  value: z.number().min(0).describe("Volume level (0 = silence, 1 = unity gain, 2 = double)"),
});

export function registerAudioTools(server: McpServer): void {
  server.tool(
    "set_clip_volume",
    "Set the volume level for a clip.",
    {
      clipId: z.string().describe("ID of the clip"),
      volume: z.number().min(0).max(2).describe("Volume level: 0 = silence, 1 = unity gain, 2 = double"),
    },
    async ({ clipId, volume }) =>
      run(() => {
        store.setClipVolume(clipId, volume);
        return { clipId, volume };
      }),
  );

  server.tool(
    "set_clip_fade",
    "Set fade-in and/or fade-out durations for a clip.",
    {
      clipId: z.string().describe("ID of the clip"),
      fadeIn: z
        .number()
        .min(0)
        .optional()
        .describe("Fade-in duration in seconds (0 = no fade)"),
      fadeOut: z
        .number()
        .min(0)
        .optional()
        .describe("Fade-out duration in seconds (0 = no fade)"),
    },
    async ({ clipId, fadeIn, fadeOut }) =>
      run(() => {
        store.setClipFade(clipId, fadeIn, fadeOut);
        return { clipId, fadeIn, fadeOut };
      }),
  );

  server.tool(
    "add_volume_automation",
    "Set volume automation (keyframe envelope) for a clip, replacing any existing automation.",
    {
      clipId: z.string().describe("ID of the clip"),
      points: z
        .array(automationPointSchema)
        .min(1)
        .describe("Array of {time, value} automation points, sorted by time"),
    },
    async ({ clipId, points }) =>
      run(() => {
        store.addVolumeAutomation(clipId, points);
        return { clipId, pointCount: points.length };
      }),
  );

  server.tool(
    "list_audio_effect_types",
    "List all available audio effect types with their parameter definitions.",
    {},
    async () => run(() => AUDIO_EFFECT_DEFINITIONS),
  );

  server.tool(
    "get_clip_audio_effects",
    "Get all audio effects currently applied to a clip.",
    {
      clipId: z.string().describe("ID of the clip"),
    },
    async ({ clipId }) =>
      run(() => {
        const p = store.getProject();
        for (const track of p.timeline.tracks) {
          const clip = track.clips.find((c) => c.id === clipId);
          if (clip) {
            return {
              clipId,
              volume: clip.volume,
              fade: clip.fade,
              automation: clip.automation,
              audioEffects: clip.audioEffects,
            };
          }
        }
        throw new Error(`Clip not found: ${clipId}`);
      }),
  );

  server.tool(
    "add_audio_effect",
    "Apply an audio effect to a clip. Returns the new audio effect's ID.",
    {
      clipId: z.string().describe("ID of the clip"),
      effectType: z
        .enum(["gain", "pan", "eq", "compressor", "reverb", "delay", "noiseReduction", "fadeIn", "fadeOut"])
        .describe("Audio effect type"),
      params: z
        .record(z.number())
        .optional()
        .describe("Initial parameter values. Use list_audio_effect_types to see available params."),
    },
    async ({ clipId, effectType, params }) =>
      run(() => {
        const effectId = store.addAudioEffect(clipId, effectType, params as Record<string, unknown>);
        return { effectId, clipId, effectType };
      }),
  );

  server.tool(
    "update_audio_effect",
    "Update the parameters of an audio effect on a clip.",
    {
      clipId: z.string().describe("ID of the clip"),
      effectId: z.string().describe("ID of the audio effect"),
      params: z
        .record(z.number())
        .describe("Parameter key/value pairs to update"),
    },
    async ({ clipId, effectId, params }) =>
      run(() => {
        store.updateAudioEffect(clipId, effectId, params as Record<string, unknown>);
        return { updated: true, clipId, effectId, params };
      }),
  );
}
