/**
 * Static constants and capability data for the OpenReel MCP server.
 * These mirror the constants from @openreel/core without browser dependencies.
 */

import type {
  LayerEffectType,
  VideoExportSettings,
  AudioExportSettings,
  ImageExportSettings,
} from "./types.js";

// ── Video Effects ─────────────────────────────────────────────────────────────

export type EffectCategory = "blur" | "color" | "stylize";

export interface EffectParamDefinition {
  key: string;
  label: string;
  type: "number" | "color" | "vector2d" | "curve";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: number | string;
}

export interface EffectDefinition {
  type: LayerEffectType;
  name: string;
  category: EffectCategory;
  params: EffectParamDefinition[];
}

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  {
    type: "blur",
    name: "Gaussian Blur",
    category: "blur",
    params: [{ key: "radius", label: "Radius", type: "number", min: 0, max: 100, step: 1, unit: "px", default: 10 }],
  },
  {
    type: "shadow",
    name: "Drop Shadow",
    category: "stylize",
    params: [
      { key: "offsetX", label: "Offset X", type: "number", min: -100, max: 100, step: 1, unit: "px", default: 5 },
      { key: "offsetY", label: "Offset Y", type: "number", min: -100, max: 100, step: 1, unit: "px", default: 5 },
      { key: "blur", label: "Blur", type: "number", min: 0, max: 100, step: 1, unit: "px", default: 10 },
      { key: "opacity", label: "Opacity", type: "number", min: 0, max: 1, step: 0.01, default: 0.8 },
      { key: "colorR", label: "Red", type: "number", min: 0, max: 255, step: 1, default: 0 },
      { key: "colorG", label: "Green", type: "number", min: 0, max: 255, step: 1, default: 0 },
      { key: "colorB", label: "Blue", type: "number", min: 0, max: 255, step: 1, default: 0 },
    ],
  },
  {
    type: "glow",
    name: "Glow",
    category: "stylize",
    params: [
      { key: "radius", label: "Radius", type: "number", min: 0, max: 100, step: 1, unit: "px", default: 10 },
      { key: "intensity", label: "Intensity", type: "number", min: 0, max: 3, step: 0.1, default: 1 },
    ],
  },
  {
    type: "brightness",
    name: "Brightness",
    category: "color",
    params: [{ key: "value", label: "Brightness", type: "number", min: -100, max: 100, step: 1, unit: "%", default: 0 }],
  },
  {
    type: "contrast",
    name: "Contrast",
    category: "color",
    params: [{ key: "value", label: "Contrast", type: "number", min: -100, max: 100, step: 1, unit: "%", default: 0 }],
  },
  {
    type: "saturation",
    name: "Saturation",
    category: "color",
    params: [{ key: "value", label: "Saturation", type: "number", min: -100, max: 100, step: 1, unit: "%", default: 0 }],
  },
  {
    type: "hue-saturation",
    name: "Hue/Saturation",
    category: "color",
    params: [
      { key: "hue", label: "Hue", type: "number", min: -180, max: 180, step: 1, unit: "°", default: 0 },
      { key: "saturation", label: "Saturation", type: "number", min: -100, max: 100, step: 1, unit: "%", default: 0 },
      { key: "lightness", label: "Lightness", type: "number", min: -100, max: 100, step: 1, unit: "%", default: 0 },
    ],
  },
  {
    type: "color-balance",
    name: "Color Balance",
    category: "color",
    params: [
      { key: "shadowsCyanRed", label: "Shadows C/R", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "shadowsMagentaGreen", label: "Shadows M/G", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "shadowsYellowBlue", label: "Shadows Y/B", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "midtonesCyanRed", label: "Midtones C/R", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "midtonesMagentaGreen", label: "Midtones M/G", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "midtonesYellowBlue", label: "Midtones Y/B", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "highlightsCyanRed", label: "Highlights C/R", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "highlightsMagentaGreen", label: "Highlights M/G", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "highlightsYellowBlue", label: "Highlights Y/B", type: "number", min: -100, max: 100, step: 1, default: 0 },
    ],
  },
  {
    type: "curves",
    name: "Curves",
    category: "color",
    params: [
      { key: "blackPoint", label: "Black Point", type: "number", min: 0, max: 255, step: 1, default: 0 },
      { key: "whitePoint", label: "White Point", type: "number", min: 0, max: 255, step: 1, default: 255 },
      { key: "gamma", label: "Gamma", type: "number", min: 0.1, max: 3, step: 0.01, default: 1 },
    ],
  },
  {
    type: "motion-blur",
    name: "Motion Blur",
    category: "blur",
    params: [
      { key: "angle", label: "Angle", type: "number", min: 0, max: 360, step: 1, unit: "°", default: 0 },
      { key: "distance", label: "Distance", type: "number", min: 0, max: 100, step: 1, unit: "px", default: 20 },
    ],
  },
  {
    type: "radial-blur",
    name: "Radial Blur",
    category: "blur",
    params: [
      { key: "amount", label: "Amount", type: "number", min: 0, max: 100, step: 1, default: 20 },
      { key: "centerX", label: "Center X", type: "number", min: 0, max: 100, step: 1, unit: "%", default: 50 },
      { key: "centerY", label: "Center Y", type: "number", min: 0, max: 100, step: 1, unit: "%", default: 50 },
    ],
  },
  {
    type: "vignette",
    name: "Vignette",
    category: "stylize",
    params: [
      { key: "amount", label: "Amount", type: "number", min: 0, max: 100, step: 1, default: 50 },
      { key: "size", label: "Size", type: "number", min: 0, max: 100, step: 1, unit: "%", default: 50 },
      { key: "roundness", label: "Roundness", type: "number", min: -100, max: 100, step: 1, default: 0 },
      { key: "feather", label: "Feather", type: "number", min: 0, max: 100, step: 1, default: 50 },
    ],
  },
  {
    type: "film-grain",
    name: "Film Grain",
    category: "stylize",
    params: [
      { key: "amount", label: "Amount", type: "number", min: 0, max: 100, step: 1, default: 20 },
      { key: "size", label: "Size", type: "number", min: 0.5, max: 3, step: 0.1, default: 1 },
      { key: "roughness", label: "Roughness", type: "number", min: 0, max: 100, step: 1, default: 50 },
    ],
  },
  {
    type: "chromatic-aberration",
    name: "Chromatic Aberration",
    category: "stylize",
    params: [
      { key: "amount", label: "Amount", type: "number", min: 0, max: 50, step: 0.5, unit: "px", default: 5 },
      { key: "angle", label: "Angle", type: "number", min: 0, max: 360, step: 1, unit: "°", default: 0 },
    ],
  },
];

export function getEffectDefinition(type: LayerEffectType): EffectDefinition | undefined {
  return EFFECT_DEFINITIONS.find((d) => d.type === type);
}

export function getEffectsByCategory(category: EffectCategory): EffectDefinition[] {
  return EFFECT_DEFINITIONS.filter((d) => d.category === category);
}

// ── Transition presets ────────────────────────────────────────────────────────

export interface TransitionPreset {
  id: string;
  name: string;
  category: "basic" | "motion" | "blur" | "creative";
  type: string;
  defaultDuration: number;
  description: string;
}

export const TRANSITION_PRESETS: TransitionPreset[] = [
  { id: "crossfade", name: "Crossfade", category: "basic", type: "crossfade", defaultDuration: 0.5, description: "Smooth blend between clips" },
  { id: "dip-to-black", name: "Dip to Black", category: "basic", type: "dipToBlack", defaultDuration: 0.5, description: "Fade through black" },
  { id: "dip-to-white", name: "Dip to White", category: "basic", type: "dipToWhite", defaultDuration: 0.5, description: "Fade through white" },
  { id: "wipe-left", name: "Wipe Left", category: "motion", type: "wipe", defaultDuration: 0.6, description: "Wipe from right to left" },
  { id: "wipe-right", name: "Wipe Right", category: "motion", type: "wipe", defaultDuration: 0.6, description: "Wipe from left to right" },
  { id: "slide-left", name: "Slide Left", category: "motion", type: "slide", defaultDuration: 0.5, description: "Slide out to the left" },
  { id: "slide-right", name: "Slide Right", category: "motion", type: "slide", defaultDuration: 0.5, description: "Slide out to the right" },
  { id: "push-left", name: "Push Left", category: "motion", type: "push", defaultDuration: 0.5, description: "Push previous clip left" },
  { id: "push-right", name: "Push Right", category: "motion", type: "push", defaultDuration: 0.5, description: "Push previous clip right" },
  { id: "zoom-in", name: "Zoom In", category: "motion", type: "zoom", defaultDuration: 0.6, description: "Zoom into the next clip" },
  { id: "zoom-out", name: "Zoom Out", category: "motion", type: "zoom", defaultDuration: 0.6, description: "Zoom out from current clip" },
];

// ── Audio effect types ────────────────────────────────────────────────────────

export const AUDIO_EFFECT_DEFINITIONS = [
  {
    type: "gain",
    name: "Gain",
    description: "Adjust the volume level of a clip",
    params: [{ key: "value", label: "Gain (dB)", type: "number", min: -60, max: 24, step: 0.1, default: 0 }],
  },
  {
    type: "pan",
    name: "Pan",
    description: "Position audio in the stereo field",
    params: [{ key: "value", label: "Pan", type: "number", min: -1, max: 1, step: 0.01, default: 0 }],
  },
  {
    type: "eq",
    name: "Equalizer",
    description: "Multi-band equalizer for tonal shaping",
    params: [
      { key: "lowGain", label: "Low (dB)", type: "number", min: -24, max: 24, step: 0.1, default: 0 },
      { key: "midGain", label: "Mid (dB)", type: "number", min: -24, max: 24, step: 0.1, default: 0 },
      { key: "highGain", label: "High (dB)", type: "number", min: -24, max: 24, step: 0.1, default: 0 },
    ],
  },
  {
    type: "compressor",
    name: "Compressor",
    description: "Dynamic range compression",
    params: [
      { key: "threshold", label: "Threshold (dB)", type: "number", min: -60, max: 0, step: 0.1, default: -24 },
      { key: "ratio", label: "Ratio", type: "number", min: 1, max: 20, step: 0.1, default: 4 },
      { key: "attack", label: "Attack (s)", type: "number", min: 0.001, max: 1, step: 0.001, default: 0.01 },
      { key: "release", label: "Release (s)", type: "number", min: 0.01, max: 3, step: 0.01, default: 0.25 },
      { key: "makeupGain", label: "Makeup Gain (dB)", type: "number", min: 0, max: 24, step: 0.1, default: 0 },
    ],
  },
  {
    type: "reverb",
    name: "Reverb",
    description: "Add spatial reverb to audio",
    params: [
      { key: "roomSize", label: "Room Size", type: "number", min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: "damping", label: "Damping", type: "number", min: 0, max: 1, step: 0.01, default: 0.5 },
      { key: "wetLevel", label: "Wet Level", type: "number", min: 0, max: 1, step: 0.01, default: 0.3 },
      { key: "dryLevel", label: "Dry Level", type: "number", min: 0, max: 1, step: 0.01, default: 0.8 },
    ],
  },
  {
    type: "delay",
    name: "Delay",
    description: "Echo/delay effect",
    params: [
      { key: "time", label: "Time (s)", type: "number", min: 0, max: 2, step: 0.01, default: 0.3 },
      { key: "feedback", label: "Feedback", type: "number", min: 0, max: 0.95, step: 0.01, default: 0.3 },
      { key: "wetLevel", label: "Wet Level", type: "number", min: 0, max: 1, step: 0.01, default: 0.3 },
    ],
  },
  {
    type: "noiseReduction",
    name: "Noise Reduction",
    description: "Remove background noise",
    params: [
      { key: "threshold", label: "Threshold (dB)", type: "number", min: -60, max: 0, step: 0.1, default: -30 },
      { key: "reduction", label: "Reduction", type: "number", min: 0, max: 1, step: 0.01, default: 0.7 },
    ],
  },
  {
    type: "fadeIn",
    name: "Fade In",
    description: "Gradually increase volume at clip start",
    params: [
      { key: "duration", label: "Duration (s)", type: "number", min: 0, max: 10, step: 0.1, default: 0.5 },
    ],
  },
  {
    type: "fadeOut",
    name: "Fade Out",
    description: "Gradually decrease volume at clip end",
    params: [
      { key: "duration", label: "Duration (s)", type: "number", min: 0, max: 10, step: 0.1, default: 0.5 },
    ],
  },
];

// ── Export presets ────────────────────────────────────────────────────────────

export const VIDEO_QUALITY_PRESETS: Record<string, { width: number; height: number; bitrate: number; frameRate: number; quality: number }> = {
  "4k-high": { width: 3840, height: 2160, bitrate: 80000, frameRate: 30, quality: 95 },
  "4k": { width: 3840, height: 2160, bitrate: 50000, frameRate: 30, quality: 90 },
  "4k-60": { width: 3840, height: 2160, bitrate: 65000, frameRate: 60, quality: 90 },
  "1080p-high": { width: 1920, height: 1080, bitrate: 25000, frameRate: 30, quality: 95 },
  "1080p": { width: 1920, height: 1080, bitrate: 15000, frameRate: 30, quality: 85 },
  "1080p-60": { width: 1920, height: 1080, bitrate: 24000, frameRate: 60, quality: 90 },
  "720p": { width: 1280, height: 720, bitrate: 8000, frameRate: 30, quality: 80 },
  "480p": { width: 854, height: 480, bitrate: 4000, frameRate: 30, quality: 75 },
};

export const DEFAULT_VIDEO_SETTINGS: VideoExportSettings = {
  format: "mp4",
  codec: "h264",
  width: 1920,
  height: 1080,
  frameRate: 30,
  bitrate: 5000,
  bitrateMode: "cbr",
  quality: 80,
  keyframeInterval: 60,
  audioSettings: {
    format: "aac",
    sampleRate: 48000,
    bitDepth: 16,
    bitrate: 192,
    channels: 2,
  },
};

export const DEFAULT_AUDIO_SETTINGS: AudioExportSettings = {
  format: "mp3",
  sampleRate: 48000,
  bitDepth: 16,
  bitrate: 320,
  channels: 2,
};

export const DEFAULT_IMAGE_SETTINGS: ImageExportSettings = {
  format: "jpg",
  quality: 90,
  width: 1920,
  height: 1080,
};

export const CODEC_MAP: Record<string, string[]> = {
  mp4: ["h264", "h265", "av1"],
  webm: ["vp8", "vp9", "av1"],
  mov: ["h264", "h265", "prores"],
};

export const PRORES_PROFILES = ["proxy", "lt", "standard", "hq", "4444", "4444xq"] as const;

// ── Template categories ───────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES = [
  { id: "social-media", name: "Social Media" },
  { id: "youtube", name: "YouTube" },
  { id: "tiktok", name: "TikTok" },
  { id: "instagram", name: "Instagram" },
  { id: "business", name: "Business" },
  { id: "personal", name: "Personal" },
  { id: "slideshow", name: "Slideshow" },
  { id: "intro-outro", name: "Intro / Outro" },
  { id: "lower-third", name: "Lower Third" },
  { id: "custom", name: "Custom" },
];

export const BUILTIN_TEMPLATES = [
  {
    id: "youtube-intro",
    name: "YouTube Intro",
    category: "youtube",
    description: "10-second animated intro with logo and channel name",
    settings: { width: 1920, height: 1080, frameRate: 30 },
    placeholders: [
      { id: "logo", type: "media", label: "Logo / Image", required: false },
      { id: "channel-name", type: "text", label: "Channel Name", required: true },
      { id: "tagline", type: "text", label: "Tagline", required: false },
    ],
  },
  {
    id: "lower-third",
    name: "Lower Third",
    category: "lower-third",
    description: "Animated name and title lower-third overlay",
    settings: { width: 1920, height: 1080, frameRate: 30 },
    placeholders: [
      { id: "name", type: "text", label: "Name", required: true },
      { id: "title", type: "text", label: "Title / Role", required: false },
    ],
  },
  {
    id: "social-story",
    name: "Social Story",
    category: "social-media",
    description: "Vertical 9:16 template for social media stories",
    settings: { width: 1080, height: 1920, frameRate: 30 },
    placeholders: [
      { id: "background", type: "media", label: "Background Video / Image", required: true },
      { id: "headline", type: "text", label: "Headline", required: false },
    ],
  },
  {
    id: "slideshow",
    name: "Photo Slideshow",
    category: "slideshow",
    description: "Elegant slideshow with transitions and optional music",
    settings: { width: 1920, height: 1080, frameRate: 30 },
    placeholders: [
      { id: "photo-1", type: "media", label: "Photo 1", required: true },
      { id: "photo-2", type: "media", label: "Photo 2", required: false },
      { id: "photo-3", type: "media", label: "Photo 3", required: false },
      { id: "music", type: "media", label: "Background Music", required: false },
    ],
  },
];
