/**
 * Core type definitions for the OpenReel MCP server.
 * These mirror the types from @openreel/core without importing browser-specific code.
 */

// ── Project ──────────────────────────────────────────────────────────────────

export interface ProjectSettings {
  readonly width: number;
  readonly height: number;
  readonly frameRate: number;
  readonly sampleRate: number;
  readonly channels: number;
}

export interface MediaMetadata {
  readonly duration: number;
  readonly width: number;
  readonly height: number;
  readonly frameRate: number;
  readonly codec: string;
  readonly sampleRate: number;
  readonly channels: number;
  readonly fileSize: number;
}

export interface MediaItem {
  readonly id: string;
  readonly name: string;
  readonly type: "video" | "audio" | "image";
  readonly fileHandle: null;
  readonly blob: null;
  readonly metadata: MediaMetadata;
  readonly thumbnailUrl: string | null;
  readonly waveformData: null;
  readonly isPlaceholder?: boolean;
  readonly sourceFile?: { name: string; size: number; lastModified: number; folder?: string };
}

export interface MediaLibrary {
  readonly items: MediaItem[];
}

// ── Timeline ─────────────────────────────────────────────────────────────────

export type FitMode = "contain" | "cover" | "stretch" | "none";

export interface Transform {
  readonly position: { x: number; y: number };
  readonly scale: { x: number; y: number };
  readonly rotation: number;
  readonly anchor: { x: number; y: number };
  readonly opacity: number;
  readonly borderRadius?: number;
  readonly fitMode?: FitMode;
  readonly rotate3d?: { x: number; y: number; z: number };
  readonly perspective?: number;
  readonly transformStyle?: "flat" | "preserve-3d";
  readonly crop?: { x: number; y: number; width: number; height: number };
}

export type EasingType =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "bezier"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic"
  | "easeInQuart"
  | "easeOutQuart"
  | "easeInOutQuart"
  | "easeInQuint"
  | "easeOutQuint"
  | "easeInOutQuint"
  | "easeInSine"
  | "easeOutSine"
  | "easeInOutSine"
  | "easeInExpo"
  | "easeOutExpo"
  | "easeInOutExpo"
  | "easeInCirc"
  | "easeOutCirc"
  | "easeInOutCirc"
  | "easeInBack"
  | "easeOutBack"
  | "easeInOutBack"
  | "easeInElastic"
  | "easeOutElastic"
  | "easeInOutElastic"
  | "easeInBounce"
  | "easeOutBounce"
  | "easeInOutBounce";

export interface Keyframe {
  readonly id: string;
  readonly time: number;
  readonly property: string;
  readonly value: unknown;
  readonly easing: EasingType;
}

export interface AutomationPoint {
  readonly time: number;
  readonly value: number;
}

export interface Effect {
  readonly id: string;
  readonly type: string;
  readonly params: Record<string, unknown>;
  readonly enabled: boolean;
}

export interface Clip {
  readonly id: string;
  readonly mediaId: string;
  readonly trackId: string;
  readonly startTime: number;
  readonly duration: number;
  readonly inPoint: number;
  readonly outPoint: number;
  readonly effects: Effect[];
  readonly audioEffects: Effect[];
  readonly transform: Transform;
  readonly blendMode?: BlendMode;
  readonly blendOpacity?: number;
  readonly volume: number;
  readonly fade?: { fadeIn: number; fadeOut: number };
  readonly automation?: { volume?: AutomationPoint[]; pan?: AutomationPoint[] };
  readonly keyframes: Keyframe[];
  readonly speed?: number;
  readonly reversed?: boolean;
}

export interface Transition {
  readonly id: string;
  readonly clipAId: string;
  readonly clipBId: string;
  readonly type: TransitionType;
  readonly duration: number;
  readonly params: Record<string, unknown>;
}

export type TransitionType =
  | "crossfade"
  | "dipToBlack"
  | "dipToWhite"
  | "wipe"
  | "slide"
  | "zoom"
  | "push";

export interface Track {
  readonly id: string;
  readonly type: "video" | "audio" | "image" | "text" | "graphics";
  readonly name: string;
  readonly clips: Clip[];
  readonly transitions: Transition[];
  readonly locked: boolean;
  readonly hidden: boolean;
  readonly muted: boolean;
  readonly solo: boolean;
}

export interface Marker {
  readonly id: string;
  readonly time: number;
  readonly label: string;
  readonly color: string;
}

export type CaptionAnimationStyle =
  | "none"
  | "word-highlight"
  | "word-by-word"
  | "karaoke"
  | "bounce"
  | "typewriter";

export interface SubtitleWord {
  readonly text: string;
  readonly startTime: number;
  readonly endTime: number;
}

export interface SubtitleStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly color: string;
  readonly backgroundColor: string;
  readonly position: "top" | "center" | "bottom";
  readonly highlightColor?: string;
  readonly upcomingColor?: string;
}

export interface Subtitle {
  readonly id: string;
  readonly text: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly style?: SubtitleStyle;
  readonly words?: SubtitleWord[];
  readonly animationStyle?: CaptionAnimationStyle;
}

export interface TimelineBeatMarker {
  readonly time: number;
  readonly strength: number;
  readonly index: number;
  readonly isDownbeat: boolean;
}

export interface TimelineBeatAnalysis {
  readonly bpm: number;
  readonly confidence: number;
  readonly sourceClipId?: string;
  readonly analyzedAt: number;
}

export interface Timeline {
  readonly tracks: Track[];
  readonly subtitles: Subtitle[];
  readonly duration: number;
  readonly markers: Marker[];
  readonly beatMarkers?: TimelineBeatMarker[];
  readonly beatAnalysis?: TimelineBeatAnalysis;
}

// ── Text clips ────────────────────────────────────────────────────────────────

export type FontWeight = number | "normal" | "bold";
export type TextAlign = "left" | "center" | "right" | "justify";
export type VerticalAlign = "top" | "middle" | "bottom";
export type TextDecoration = "none" | "underline" | "line-through" | "overline";

export interface TextStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: FontWeight;
  readonly fontStyle: "normal" | "italic";
  readonly color: string;
  readonly backgroundColor?: string;
  readonly strokeColor?: string;
  readonly strokeWidth?: number;
  readonly shadowColor?: string;
  readonly shadowBlur?: number;
  readonly shadowOffsetX?: number;
  readonly shadowOffsetY?: number;
  readonly textAlign: TextAlign;
  readonly verticalAlign: VerticalAlign;
  readonly lineHeight: number;
  readonly letterSpacing: number;
  readonly textDecoration?: TextDecoration;
}

export type TextAnimationPreset =
  | "none"
  | "typewriter"
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "scale"
  | "blur"
  | "bounce"
  | "rotate"
  | "wave"
  | "shake"
  | "pop"
  | "glitch"
  | "split"
  | "flip"
  | "word-by-word"
  | "rainbow";

export interface TextAnimationParams {
  readonly fadeOpacity?: { start: number; end: number };
  readonly slideDistance?: number;
  readonly scaleFrom?: number;
  readonly scaleTo?: number;
  readonly blurAmount?: number;
  readonly bounceHeight?: number;
  readonly bounceCount?: number;
  readonly rotateAngle?: number;
  readonly waveAmplitude?: number;
  readonly waveFrequency?: number;
  readonly shakeIntensity?: number;
  readonly shakeSpeed?: number;
  readonly popOvershoot?: number;
  readonly glitchIntensity?: number;
  readonly glitchSpeed?: number;
  readonly splitDirection?: "horizontal" | "vertical";
  readonly flipAxis?: "x" | "y";
  readonly rainbowSpeed?: number;
}

export interface TextAnimation {
  readonly preset: TextAnimationPreset;
  readonly params: TextAnimationParams;
  readonly inDuration: number;
  readonly outDuration: number;
  readonly stagger?: number;
  readonly unit?: "character" | "word" | "line";
}

export interface TextClip {
  readonly id: string;
  readonly trackId: string;
  readonly startTime: number;
  readonly duration: number;
  readonly text: string;
  readonly style: TextStyle;
  readonly transform: Transform;
  readonly animation?: TextAnimation;
  readonly keyframes: Keyframe[];
  readonly blendMode?: BlendMode;
  readonly blendOpacity?: number;
}

// ── Graphics clips ────────────────────────────────────────────────────────────

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export type ShapeType =
  | "rectangle"
  | "circle"
  | "ellipse"
  | "triangle"
  | "arrow"
  | "line"
  | "polygon"
  | "star";

export interface FillStyle {
  readonly type: "solid" | "gradient" | "none";
  readonly color?: string;
  readonly opacity: number;
}

export interface StrokeStyle {
  readonly color: string;
  readonly width: number;
  readonly opacity: number;
  readonly dashArray?: number[];
  readonly lineCap?: "butt" | "round" | "square";
  readonly lineJoin?: "miter" | "round" | "bevel";
}

export interface ShapeStyle {
  readonly fill: FillStyle;
  readonly stroke: StrokeStyle;
  readonly cornerRadius?: number;
  readonly points?: number;
  readonly innerRadius?: number;
}

export interface ShapeClip {
  readonly id: string;
  readonly trackId: string;
  readonly startTime: number;
  readonly duration: number;
  readonly type: "shape";
  readonly shapeType: ShapeType;
  readonly style: ShapeStyle;
  readonly transform: Transform;
  readonly keyframes: Keyframe[];
  readonly blendMode?: BlendMode;
  readonly blendOpacity?: number;
}

export interface SVGClip {
  readonly id: string;
  readonly trackId: string;
  readonly startTime: number;
  readonly duration: number;
  readonly type: "svg";
  readonly svgContent: string;
  readonly transform: Transform;
  readonly keyframes: Keyframe[];
  readonly blendMode?: BlendMode;
  readonly blendOpacity?: number;
}

export interface StickerClip {
  readonly id: string;
  readonly trackId: string;
  readonly startTime: number;
  readonly duration: number;
  readonly type: "sticker" | "emoji";
  readonly imageUrl: string;
  readonly category?: string;
  readonly name?: string;
  readonly transform: Transform;
  readonly keyframes: Keyframe[];
  readonly blendMode?: BlendMode;
  readonly blendOpacity?: number;
}

// ── Project ───────────────────────────────────────────────────────────────────

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly modifiedAt: number;
  readonly settings: ProjectSettings;
  readonly mediaLibrary: MediaLibrary;
  readonly timeline: Timeline;
  readonly textClips?: TextClip[];
  readonly shapeClips?: ShapeClip[];
  readonly svgClips?: SVGClip[];
  readonly stickerClips?: StickerClip[];
}

// ── Effect types ──────────────────────────────────────────────────────────────

export type LayerEffectType =
  | "blur"
  | "shadow"
  | "glow"
  | "brightness"
  | "contrast"
  | "saturation"
  | "hue-saturation"
  | "color-balance"
  | "curves"
  | "motion-blur"
  | "radial-blur"
  | "vignette"
  | "film-grain"
  | "chromatic-aberration";

export type AudioEffectType =
  | "gain"
  | "pan"
  | "eq"
  | "compressor"
  | "reverb"
  | "delay"
  | "noiseReduction"
  | "fadeIn"
  | "fadeOut";

// ── Export types ──────────────────────────────────────────────────────────────

export interface VideoExportSettings {
  format: "mp4" | "webm" | "mov";
  codec: "h264" | "h265" | "vp8" | "vp9" | "av1" | "prores";
  proresProfile?: "proxy" | "lt" | "standard" | "hq" | "4444" | "4444xq";
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  bitrateMode: "cbr" | "vbr";
  quality: number;
  keyframeInterval: number;
  audioSettings: AudioExportSettings;
  colorDepth?: 8 | 10 | 12;
}

export interface AudioExportSettings {
  format: "mp3" | "wav" | "aac" | "flac" | "ogg";
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24 | 32;
  bitrate: number;
  channels: 1 | 2;
}

export interface ImageExportSettings {
  format: "jpg" | "png" | "webp";
  quality: number;
  width: number;
  height: number;
}
