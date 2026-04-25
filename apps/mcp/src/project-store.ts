/**
 * In-memory project store for the OpenReel MCP server.
 * Loads/saves projects as JSON files (.openreel).
 */

import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { produce } from "immer";
import type {
  Project,
  ProjectSettings,
  Track,
  Clip,
  Subtitle,
  TextClip,
  ShapeClip,
  Transform,
  AutomationPoint,
  TransitionType,
  EasingType,
} from "./types.js";

const SCHEMA_VERSION = "1.0.0";

interface ProjectFile {
  version: string;
  project: Project;
}

function generateId(): string {
  return crypto.randomUUID();
}

function createDefaultTransform(): Transform {
  return {
    position: { x: 0.5, y: 0.5 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    anchor: { x: 0.5, y: 0.5 },
    opacity: 1,
  };
}

function createEmptyProject(name: string, settings?: Partial<ProjectSettings>): Project {
  const defaults: ProjectSettings = {
    width: 1920,
    height: 1080,
    frameRate: 30,
    sampleRate: 48000,
    channels: 2,
  };
  return {
    id: generateId(),
    name,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    settings: { ...defaults, ...settings },
    mediaLibrary: { items: [] },
    timeline: {
      tracks: [],
      subtitles: [],
      duration: 0,
      markers: [],
    },
    textClips: [],
    shapeClips: [],
    svgClips: [],
    stickerClips: [],
  };
}

// ── Store class ──────────────────────────────────────────────────────────────

export class ProjectStore {
  private project: Project;
  private filePath: string | null = null;

  constructor() {
    this.project = createEmptyProject("Untitled Project");
  }

  // ── I/O ──────────────────────────────────────────────────────────────────

  async loadFromFile(filePath: string): Promise<void> {
    const raw = await readFile(filePath, "utf-8");
    const file = JSON.parse(raw) as ProjectFile;
    this.project = file.project;
    this.filePath = filePath;
  }

  async saveToFile(filePath?: string): Promise<string> {
    const target = filePath ?? this.filePath;
    if (!target) throw new Error("No file path specified and no previously loaded path");
    const file: ProjectFile = {
      version: SCHEMA_VERSION,
      project: produce(this.project, (draft) => {
        draft.modifiedAt = Date.now();
      }),
    };
    await writeFile(target, JSON.stringify(file, null, 2), "utf-8");
    this.filePath = target;
    return target;
  }

  // ── Reads ────────────────────────────────────────────────────────────────

  getProject(): Project {
    return this.project;
  }

  getCurrentFilePath(): string | null {
    return this.filePath;
  }

  // ── Project mutations ────────────────────────────────────────────────────

  createProject(name: string, settings?: Partial<ProjectSettings>): Project {
    this.project = createEmptyProject(name, settings);
    this.filePath = null;
    return this.project;
  }

  updateSettings(settings: Partial<ProjectSettings>): Project {
    this.project = produce(this.project, (draft) => {
      Object.assign(draft.settings, settings);
      draft.modifiedAt = Date.now();
    });
    return this.project;
  }

  renameProject(name: string): Project {
    this.project = produce(this.project, (draft) => {
      draft.name = name;
      draft.modifiedAt = Date.now();
    });
    return this.project;
  }

  // ── Media mutations ──────────────────────────────────────────────────────

  addMediaPlaceholder(filePath: string, name: string, type: "video" | "audio" | "image"): Project {
    const fileName = name || basename(filePath);
    this.project = produce(this.project, (draft) => {
      draft.mediaLibrary.items.push({
        id: generateId(),
        name: fileName,
        type,
        fileHandle: null,
        blob: null,
        metadata: {
          duration: 0,
          width: 0,
          height: 0,
          frameRate: 0,
          codec: "",
          sampleRate: 0,
          channels: 0,
          fileSize: 0,
        },
        thumbnailUrl: null,
        waveformData: null,
        isPlaceholder: true,
        sourceFile: {
          name: fileName,
          size: 0,
          lastModified: Date.now(),
          folder: dirname(filePath),
        },
      });
      draft.modifiedAt = Date.now();
    });
    return this.project;
  }

  deleteMedia(mediaId: string): Project {
    this.project = produce(this.project, (draft) => {
      const idx = draft.mediaLibrary.items.findIndex((m) => m.id === mediaId);
      if (idx === -1) throw new Error(`Media not found: ${mediaId}`);
      draft.mediaLibrary.items.splice(idx, 1);
      draft.modifiedAt = Date.now();
    });
    return this.project;
  }

  renameMedia(mediaId: string, name: string): Project {
    this.project = produce(this.project, (draft) => {
      const item = draft.mediaLibrary.items.find((m) => m.id === mediaId);
      if (!item) throw new Error(`Media not found: ${mediaId}`);
      item.name = name;
      draft.modifiedAt = Date.now();
    });
    return this.project;
  }

  // ── Track mutations ──────────────────────────────────────────────────────

  addTrack(trackType: Track["type"], position?: number): Track {
    let newTrack!: Track;
    this.project = produce(this.project, (draft) => {
      const track: Track = {
        id: generateId(),
        type: trackType,
        name: `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track ${draft.timeline.tracks.length + 1}`,
        clips: [],
        transitions: [],
        locked: false,
        hidden: false,
        muted: false,
        solo: false,
      };
      if (position !== undefined && position >= 0 && position <= draft.timeline.tracks.length) {
        draft.timeline.tracks.splice(position, 0, track);
      } else {
        draft.timeline.tracks.push(track);
      }
      newTrack = track;
      draft.modifiedAt = Date.now();
    });
    return newTrack;
  }

  removeTrack(trackId: string): void {
    this.project = produce(this.project, (draft) => {
      const idx = draft.timeline.tracks.findIndex((t) => t.id === trackId);
      if (idx === -1) throw new Error(`Track not found: ${trackId}`);
      draft.timeline.tracks.splice(idx, 1);
      draft.modifiedAt = Date.now();
    });
  }

  reorderTrack(trackId: string, newPosition: number): void {
    this.project = produce(this.project, (draft) => {
      const idx = draft.timeline.tracks.findIndex((t) => t.id === trackId);
      if (idx === -1) throw new Error(`Track not found: ${trackId}`);
      const [track] = draft.timeline.tracks.splice(idx, 1);
      draft.timeline.tracks.splice(newPosition, 0, track);
      draft.modifiedAt = Date.now();
    });
  }

  setTrackLocked(trackId: string, locked: boolean): void {
    this.project = produce(this.project, (draft) => {
      const track = draft.timeline.tracks.find((t) => t.id === trackId);
      if (!track) throw new Error(`Track not found: ${trackId}`);
      track.locked = locked;
      draft.modifiedAt = Date.now();
    });
  }

  setTrackVisibility(trackId: string, opts: { hidden?: boolean; muted?: boolean; solo?: boolean }): void {
    this.project = produce(this.project, (draft) => {
      const track = draft.timeline.tracks.find((t) => t.id === trackId);
      if (!track) throw new Error(`Track not found: ${trackId}`);
      if (opts.hidden !== undefined) track.hidden = opts.hidden;
      if (opts.muted !== undefined) track.muted = opts.muted;
      if (opts.solo !== undefined) track.solo = opts.solo;
      draft.modifiedAt = Date.now();
    });
  }

  // ── Clip mutations ───────────────────────────────────────────────────────

  addClip(trackId: string, mediaId: string, startTime: number): Clip {
    let newClip!: Clip;
    this.project = produce(this.project, (draft) => {
      const track = draft.timeline.tracks.find((t) => t.id === trackId);
      if (!track) throw new Error(`Track not found: ${trackId}`);
      const media = draft.mediaLibrary.items.find((m) => m.id === mediaId);
      const duration = media?.metadata.duration || 5;
      const clip: Clip = {
        id: generateId(),
        mediaId,
        trackId,
        startTime,
        duration,
        inPoint: 0,
        outPoint: duration,
        effects: [],
        audioEffects: [],
        transform: createDefaultTransform(),
        volume: 1,
        keyframes: [],
      };
      track.clips.push(clip);
      track.clips.sort((a, b) => a.startTime - b.startTime);
      const endTime = startTime + duration;
      if (endTime > draft.timeline.duration) {
        draft.timeline.duration = endTime;
      }
      newClip = clip;
      draft.modifiedAt = Date.now();
    });
    return newClip;
  }

  removeClip(clipId: string): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const idx = track.clips.findIndex((c) => c.id === clipId);
        if (idx !== -1) {
          track.clips.splice(idx, 1);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  moveClip(clipId: string, startTime: number, targetTrackId?: string): void {
    this.project = produce(this.project, (draft) => {
      let sourceTrackId = "";
      let sourceIdx = -1;
      for (const track of draft.timeline.tracks) {
        const idx = track.clips.findIndex((c) => c.id === clipId);
        if (idx !== -1) {
          sourceTrackId = track.id;
          sourceIdx = idx;
          break;
        }
      }
      if (sourceIdx === -1) throw new Error(`Clip not found: ${clipId}`);
      const sourceTrack = draft.timeline.tracks.find((t) => t.id === sourceTrackId)!;
      if (targetTrackId && targetTrackId !== sourceTrackId) {
        const targetTrack = draft.timeline.tracks.find((t) => t.id === targetTrackId);
        if (!targetTrack) throw new Error(`Target track not found: ${targetTrackId}`);
        const [clip] = sourceTrack.clips.splice(sourceIdx, 1);
        clip.startTime = startTime;
        clip.trackId = targetTrackId;
        targetTrack.clips.push(clip);
        targetTrack.clips.sort((a, b) => a.startTime - b.startTime);
      } else {
        sourceTrack.clips[sourceIdx].startTime = startTime;
      }
      draft.modifiedAt = Date.now();
    });
  }

  trimClip(clipId: string, inPoint?: number, outPoint?: number): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          if (inPoint !== undefined) clip.inPoint = inPoint;
          if (outPoint !== undefined) {
            clip.outPoint = outPoint;
            clip.duration = outPoint - clip.inPoint;
          }
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  splitClip(clipId: string, time: number): Clip {
    let secondClip!: Clip;
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const idx = track.clips.findIndex((c) => c.id === clipId);
        if (idx !== -1) {
          const original = track.clips[idx];
          const clipEnd = original.startTime + original.duration;
          if (time <= original.startTime || time >= clipEnd) {
            throw new Error("Split time is outside clip range");
          }
          const splitPoint = time - original.startTime;
          const originalOutPoint = original.outPoint;
          const originalDuration = original.duration;
          original.duration = splitPoint;
          original.outPoint = original.inPoint + splitPoint;
          const nc: Clip = {
            id: generateId(),
            mediaId: original.mediaId,
            trackId: original.trackId,
            startTime: time,
            duration: originalDuration - splitPoint,
            inPoint: original.inPoint + splitPoint,
            outPoint: originalOutPoint,
            effects: original.effects.map((e) => ({ ...e, id: generateId() })),
            audioEffects: original.audioEffects.map((e) => ({ ...e, id: generateId() })),
            transform: { ...original.transform },
            volume: original.volume,
            keyframes: [],
          };
          track.clips.splice(idx + 1, 0, nc);
          secondClip = nc;
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
    return secondClip;
  }

  rippleDelete(clipId: string): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const idx = track.clips.findIndex((c) => c.id === clipId);
        if (idx !== -1) {
          const gap = track.clips[idx].duration;
          track.clips.splice(idx, 1);
          for (let i = idx; i < track.clips.length; i++) {
            track.clips[i].startTime -= gap;
          }
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  // ── Effect mutations ─────────────────────────────────────────────────────

  addEffect(clipId: string, effectType: string, params?: Record<string, unknown>): string {
    const effectId = generateId();
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          clip.effects.push({ id: effectId, type: effectType, params: params ?? {}, enabled: true });
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
    return effectId;
  }

  removeEffect(clipId: string, effectId: string): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const idx = clip.effects.findIndex((e) => e.id === effectId);
          if (idx === -1) throw new Error(`Effect not found: ${effectId}`);
          clip.effects.splice(idx, 1);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  updateEffect(clipId: string, effectId: string, params: Record<string, unknown>): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const effect = clip.effects.find((e) => e.id === effectId);
          if (!effect) throw new Error(`Effect not found: ${effectId}`);
          Object.assign(effect.params, params);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  reorderEffect(clipId: string, effectId: string, newIndex: number): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const idx = clip.effects.findIndex((e) => e.id === effectId);
          if (idx === -1) throw new Error(`Effect not found: ${effectId}`);
          const [effect] = clip.effects.splice(idx, 1);
          clip.effects.splice(newIndex, 0, effect);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  // ── Transform mutations ──────────────────────────────────────────────────

  updateTransform(clipId: string, transform: Partial<Transform>): void {
    this.project = produce(this.project, (draft) => {
      // Check regular clips
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          Object.assign(clip.transform, transform);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      // Check text clips
      for (const tc of draft.textClips ?? []) {
        if (tc.id === clipId) {
          Object.assign(tc.transform, transform);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      // Check shape clips
      for (const sc of draft.shapeClips ?? []) {
        if (sc.id === clipId) {
          Object.assign(sc.transform, transform);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  // ── Keyframe mutations ───────────────────────────────────────────────────

  addKeyframe(clipId: string, property: string, time: number, value: unknown, easing: EasingType = "linear"): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const existing = clip.keyframes.findIndex((k) => k.property === property && k.time === time);
          if (existing !== -1) throw new Error("Keyframe already exists at this time for this property");
          clip.keyframes.push({ id: generateId(), time, property, value, easing });
          clip.keyframes.sort((a, b) => a.time - b.time);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  removeKeyframe(clipId: string, property: string, time: number): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const idx = clip.keyframes.findIndex((k) => k.property === property && k.time === time);
          if (idx === -1) throw new Error("Keyframe not found");
          clip.keyframes.splice(idx, 1);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  updateKeyframe(clipId: string, property: string, time: number, value?: unknown, easing?: EasingType): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const kf = clip.keyframes.find((k) => k.property === property && k.time === time);
          if (!kf) throw new Error("Keyframe not found");
          if (value !== undefined) kf.value = value;
          if (easing !== undefined) kf.easing = easing;
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  // ── Transition mutations ─────────────────────────────────────────────────

  addTransition(clipAId: string, clipBId: string, transitionType: TransitionType, duration: number): string {
    const transitionId = generateId();
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clipA = track.clips.find((c) => c.id === clipAId);
        const clipB = track.clips.find((c) => c.id === clipBId);
        if (clipA && clipB) {
          track.transitions.push({ id: transitionId, clipAId, clipBId, type: transitionType, duration, params: {} });
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error("Both clips must exist on the same track");
    });
    return transitionId;
  }

  removeTransition(transitionId: string): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const idx = track.transitions.findIndex((t) => t.id === transitionId);
        if (idx !== -1) {
          track.transitions.splice(idx, 1);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Transition not found: ${transitionId}`);
    });
  }

  updateTransition(transitionId: string, duration?: number, params?: Record<string, unknown>): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const transition = track.transitions.find((t) => t.id === transitionId);
        if (transition) {
          if (duration !== undefined) transition.duration = duration;
          if (params) Object.assign(transition.params, params);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Transition not found: ${transitionId}`);
    });
  }

  // ── Audio mutations ──────────────────────────────────────────────────────

  setClipVolume(clipId: string, volume: number): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          clip.volume = volume;
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  setClipFade(clipId: string, fadeIn?: number, fadeOut?: number): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          clip.fade = {
            fadeIn: fadeIn ?? clip.fade?.fadeIn ?? 0,
            fadeOut: fadeOut ?? clip.fade?.fadeOut ?? 0,
          };
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  addVolumeAutomation(clipId: string, points: AutomationPoint[]): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          if (!clip.automation) clip.automation = {};
          clip.automation.volume = points;
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  addAudioEffect(clipId: string, effectType: string, params?: Record<string, unknown>): string {
    const effectId = generateId();
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          clip.audioEffects.push({ id: effectId, type: effectType, params: params ?? {}, enabled: true });
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
    return effectId;
  }

  updateAudioEffect(clipId: string, effectId: string, params: Record<string, unknown>): void {
    this.project = produce(this.project, (draft) => {
      for (const track of draft.timeline.tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const effect = clip.audioEffects.find((e) => e.id === effectId);
          if (!effect) throw new Error(`Audio effect not found: ${effectId}`);
          Object.assign(effect.params, params);
          draft.modifiedAt = Date.now();
          return;
        }
      }
      throw new Error(`Clip not found: ${clipId}`);
    });
  }

  // ── Subtitle mutations ───────────────────────────────────────────────────

  addSubtitle(text: string, startTime: number, endTime: number): string {
    const subtitleId = generateId();
    this.project = produce(this.project, (draft) => {
      draft.timeline.subtitles.push({ id: subtitleId, text, startTime, endTime });
      draft.timeline.subtitles.sort((a, b) => a.startTime - b.startTime);
      draft.modifiedAt = Date.now();
    });
    return subtitleId;
  }

  updateSubtitle(subtitleId: string, text?: string, startTime?: number, endTime?: number): void {
    this.project = produce(this.project, (draft) => {
      const sub = draft.timeline.subtitles.find((s) => s.id === subtitleId);
      if (!sub) throw new Error(`Subtitle not found: ${subtitleId}`);
      if (text !== undefined) sub.text = text;
      if (startTime !== undefined) sub.startTime = startTime;
      if (endTime !== undefined) sub.endTime = endTime;
      draft.modifiedAt = Date.now();
    });
  }

  removeSubtitle(subtitleId: string): void {
    this.project = produce(this.project, (draft) => {
      const idx = draft.timeline.subtitles.findIndex((s) => s.id === subtitleId);
      if (idx === -1) throw new Error(`Subtitle not found: ${subtitleId}`);
      draft.timeline.subtitles.splice(idx, 1);
      draft.modifiedAt = Date.now();
    });
  }

  importSrt(srtContent: string): number {
    const subtitles = parseSrt(srtContent);
    this.project = produce(this.project, (draft) => {
      for (const s of subtitles) {
        draft.timeline.subtitles.push({ id: generateId(), ...s });
      }
      draft.timeline.subtitles.sort((a, b) => a.startTime - b.startTime);
      draft.modifiedAt = Date.now();
    });
    return subtitles.length;
  }

  setSubtitleStyle(style: Subtitle["style"]): void {
    this.project = produce(this.project, (draft) => {
      for (const sub of draft.timeline.subtitles) {
        sub.style = style;
      }
      draft.modifiedAt = Date.now();
    });
  }

  // ── Marker mutations ─────────────────────────────────────────────────────

  addMarker(time: number, label: string, color: string): string {
    const markerId = generateId();
    this.project = produce(this.project, (draft) => {
      draft.timeline.markers.push({ id: markerId, time, label, color });
      draft.timeline.markers.sort((a, b) => a.time - b.time);
      draft.modifiedAt = Date.now();
    });
    return markerId;
  }

  removeMarker(markerId: string): void {
    this.project = produce(this.project, (draft) => {
      const idx = draft.timeline.markers.findIndex((m) => m.id === markerId);
      if (idx === -1) throw new Error(`Marker not found: ${markerId}`);
      draft.timeline.markers.splice(idx, 1);
      draft.modifiedAt = Date.now();
    });
  }

  // ── Text clip mutations ──────────────────────────────────────────────────

  addTextClip(
    trackId: string,
    startTime: number,
    duration: number,
    text: string,
    style?: Partial<TextClip["style"]>,
  ): string {
    const clipId = generateId();
    this.project = produce(this.project, (draft) => {
      const track = draft.timeline.tracks.find((t) => t.id === trackId);
      if (!track) throw new Error(`Track not found: ${trackId}`);
      if (track.type !== "text") throw new Error("Track must be of type 'text'");
      const defaultStyle: TextClip["style"] = {
        fontFamily: "Arial",
        fontSize: 48,
        fontWeight: 400,
        fontStyle: "normal",
        color: "#ffffff",
        textAlign: "center",
        verticalAlign: "middle",
        lineHeight: 1.2,
        letterSpacing: 0,
      };
      const transform = createDefaultTransform();
      const textClip: TextClip = {
        id: clipId,
        trackId,
        startTime,
        duration,
        text,
        style: { ...defaultStyle, ...style },
        transform,
        keyframes: [],
      };
      if (!draft.textClips) draft.textClips = [];
      draft.textClips.push(textClip);
      // Add a corresponding clip reference in the track
      track.clips.push({
        id: generateId(),
        mediaId: clipId,
        trackId,
        startTime,
        duration,
        inPoint: 0,
        outPoint: duration,
        effects: [],
        audioEffects: [],
        transform,
        volume: 1,
        keyframes: [],
      });
      draft.modifiedAt = Date.now();
    });
    return clipId;
  }

  updateTextClip(clipId: string, text?: string, style?: Partial<TextClip["style"]>): void {
    this.project = produce(this.project, (draft) => {
      const tc = (draft.textClips ?? []).find((t) => t.id === clipId);
      if (!tc) throw new Error(`Text clip not found: ${clipId}`);
      if (text !== undefined) tc.text = text;
      if (style) Object.assign(tc.style, style);
      draft.modifiedAt = Date.now();
    });
  }

  // ── Shape clip mutations ─────────────────────────────────────────────────

  addShapeClip(
    trackId: string,
    startTime: number,
    duration: number,
    shapeType: ShapeClip["shapeType"],
    style?: Partial<ShapeClip["style"]>,
  ): string {
    const clipId = generateId();
    this.project = produce(this.project, (draft) => {
      const track = draft.timeline.tracks.find((t) => t.id === trackId);
      if (!track) throw new Error(`Track not found: ${trackId}`);
      if (track.type !== "graphics") throw new Error("Track must be of type 'graphics'");
      const defaultStyle: ShapeClip["style"] = {
        fill: { type: "solid", color: "#3b82f6", opacity: 1 },
        stroke: { color: "#1d4ed8", width: 2, opacity: 1 },
      };
      const transform = createDefaultTransform();
      const mergedFill = { ...defaultStyle.fill, ...style?.fill };
      const mergedStroke = { ...defaultStyle.stroke, ...style?.stroke };
      const shapeClip: ShapeClip = {
        id: clipId,
        trackId,
        startTime,
        duration,
        type: "shape",
        shapeType,
        style: { fill: mergedFill, stroke: mergedStroke },
        transform,
        keyframes: [],
      };
      if (!draft.shapeClips) draft.shapeClips = [];
      draft.shapeClips.push(shapeClip);
      track.clips.push({
        id: generateId(),
        mediaId: clipId,
        trackId,
        startTime,
        duration,
        inPoint: 0,
        outPoint: duration,
        effects: [],
        audioEffects: [],
        transform,
        volume: 1,
        keyframes: [],
      });
      draft.modifiedAt = Date.now();
    });
    return clipId;
  }
}

// ── SRT parser ────────────────────────────────────────────────────────────────

interface SrtEntry {
  text: string;
  startTime: number;
  endTime: number;
}

function parseSrtTimestamp(ts: string): number {
  const [hms, ms] = ts.trim().split(",");
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s + parseInt(ms, 10) / 1000;
}

function parseSrt(content: string): SrtEntry[] {
  const blocks = content.trim().split(/\n\s*\n/);
  const entries: SrtEntry[] = [];
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;
    const timeLine = lines[1];
    const match = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!match) continue;
    entries.push({
      startTime: parseSrtTimestamp(match[1]),
      endTime: parseSrtTimestamp(match[2]),
      text: lines.slice(2).join("\n"),
    });
  }
  return entries;
}

// Singleton instance used by all tool modules
export const store = new ProjectStore();
