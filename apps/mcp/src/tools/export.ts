import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { run } from "../utils/response.js";
import {
  VIDEO_QUALITY_PRESETS,
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_IMAGE_SETTINGS,
  CODEC_MAP,
  PRORES_PROFILES,
} from "../constants.js";
import type { VideoExportSettings } from "../types.js";

const videoCodecValues = ["h264", "h265", "vp8", "vp9", "av1", "prores"] as const;
const videoFormatValues = ["mp4", "webm", "mov"] as const;
const audioFormatValues = ["mp3", "wav", "aac", "flac", "ogg"] as const;

export function registerExportTools(server: McpServer): void {
  server.tool(
    "list_export_presets",
    "List all available video quality presets with their resolution, bitrate, and frame rate.",
    {},
    async () =>
      run(() =>
        Object.entries(VIDEO_QUALITY_PRESETS).map(([id, preset]) => ({
          id,
          ...preset,
        })),
      ),
  );

  server.tool(
    "get_default_export_settings",
    "Get the default export settings for video, audio, and image formats.",
    {},
    async () =>
      run(() => ({
        video: DEFAULT_VIDEO_SETTINGS,
        audio: DEFAULT_AUDIO_SETTINGS,
        image: DEFAULT_IMAGE_SETTINGS,
      })),
  );

  server.tool(
    "get_export_codecs",
    "Get the supported video codecs and container formats, including codec/format compatibility.",
    {},
    async () =>
      run(() => ({
        videoCodecs: videoCodecValues,
        audioFormats: audioFormatValues,
        containerFormats: videoFormatValues,
        codecCompatibility: CODEC_MAP,
        proresProfiles: PRORES_PROFILES,
        codecDetails: {
          h264: { name: "H.264 / AVC", hardware: true, browserSupport: "universal" },
          h265: { name: "H.265 / HEVC", hardware: true, browserSupport: "partial" },
          vp8: { name: "VP8", hardware: false, browserSupport: "good" },
          vp9: { name: "VP9", hardware: false, browserSupport: "good" },
          av1: { name: "AV1", hardware: false, browserSupport: "modern" },
          prores: { name: "Apple ProRes", hardware: false, browserSupport: "limited" },
        },
      })),
  );

  server.tool(
    "validate_export_settings",
    "Validate export settings for compatibility, codec/format matching, and bitrate constraints. Returns any errors or warnings.",
    {
      format: z.enum(videoFormatValues).describe("Container format"),
      codec: z.enum(videoCodecValues).describe("Video codec"),
      proresProfile: z.enum(PRORES_PROFILES).optional().describe("ProRes profile (required when codec is 'prores')"),
      width: z.number().int().positive().describe("Output width in pixels"),
      height: z.number().int().positive().describe("Output height in pixels"),
      frameRate: z.number().positive().describe("Frame rate (fps)"),
      bitrate: z.number().positive().describe("Video bitrate in kbps"),
      quality: z.number().min(0).max(100).optional().describe("Quality level 0–100 (for VBR)"),
      audioFormat: z.enum(audioFormatValues).optional().describe("Audio format"),
      audioBitrate: z.number().positive().optional().describe("Audio bitrate in kbps"),
    },
    async ({ format, codec, proresProfile, width, height, frameRate, bitrate, quality, audioBitrate }) =>
      run(() => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Codec/format compatibility
        const compatibleCodecs = CODEC_MAP[format] ?? [];
        if (!compatibleCodecs.includes(codec)) {
          errors.push(`Codec '${codec}' is not compatible with format '${format}'. Compatible codecs: ${compatibleCodecs.join(", ")}`);
        }

        // ProRes profile requirement
        if (codec === "prores" && !proresProfile) {
          errors.push("A proresProfile must be specified when codec is 'prores'");
        }
        if (codec !== "prores" && proresProfile) {
          warnings.push("proresProfile is ignored when codec is not 'prores'");
        }

        // Bitrate sanity
        const pixelCount = width * height;
        const minBitrate = Math.round(pixelCount * frameRate * 0.0001);
        const maxBitrate = Math.round(pixelCount * frameRate * 0.05);
        if (bitrate < minBitrate) {
          warnings.push(`Bitrate ${bitrate} kbps may be too low for ${width}×${height}@${frameRate}fps. Minimum recommended: ${minBitrate} kbps`);
        }
        if (bitrate > maxBitrate) {
          warnings.push(`Bitrate ${bitrate} kbps is very high for ${width}×${height}@${frameRate}fps. Consider: ${maxBitrate} kbps`);
        }

        // Resolution sanity
        if (width % 2 !== 0 || height % 2 !== 0) {
          errors.push("Width and height must be even numbers for most codecs");
        }

        // Audio bitrate
        if (audioBitrate && (audioBitrate < 32 || audioBitrate > 1411)) {
          warnings.push(`Audio bitrate ${audioBitrate} kbps is outside the typical range (32–1411 kbps)`);
        }

        const settings: Partial<VideoExportSettings> = { format, codec, width, height, frameRate, bitrate };
        if (proresProfile) settings.proresProfile = proresProfile;
        if (quality !== undefined) settings.quality = quality;

        return {
          valid: errors.length === 0,
          errors,
          warnings,
          settings,
        };
      }),
  );
}
