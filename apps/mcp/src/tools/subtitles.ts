import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";

const CAPTION_ANIMATION_STYLES = [
  "none",
  "word-highlight",
  "word-by-word",
  "karaoke",
  "bounce",
  "typewriter",
] as const;

const subtitleStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  color: z.string().optional().describe("CSS color string, e.g. '#ffffff'"),
  backgroundColor: z.string().optional().describe("CSS color string for background box"),
  position: z.enum(["top", "center", "bottom"]).optional(),
  highlightColor: z.string().optional().describe("Color used for word-highlight and karaoke animations"),
  upcomingColor: z.string().optional().describe("Color for upcoming words in karaoke"),
});

export function registerSubtitleTools(server: McpServer): void {
  server.tool(
    "list_subtitles",
    "List all subtitles in the project timeline.",
    {},
    async () =>
      run(() => {
        const p = store.getProject();
        return p.timeline.subtitles.map((s) => ({
          id: s.id,
          text: s.text,
          startTime: s.startTime,
          endTime: s.endTime,
          duration: s.endTime - s.startTime,
          style: s.style,
          animationStyle: s.animationStyle,
        }));
      }),
  );

  server.tool(
    "add_subtitle",
    "Add a subtitle entry to the timeline. Returns the new subtitle's ID.",
    {
      text: z.string().min(1).describe("Subtitle text"),
      startTime: z.number().min(0).describe("Start time in seconds"),
      endTime: z.number().positive().describe("End time in seconds (must be > startTime)"),
    },
    async ({ text, startTime, endTime }) =>
      run(() => {
        if (endTime <= startTime) throw new Error("endTime must be greater than startTime");
        const id = store.addSubtitle(text, startTime, endTime);
        return { id, text, startTime, endTime };
      }),
  );

  server.tool(
    "update_subtitle",
    "Update a subtitle's text, timing, or both.",
    {
      subtitleId: z.string().describe("ID of the subtitle to update"),
      text: z.string().optional().describe("New text (omit to keep existing)"),
      startTime: z.number().min(0).optional().describe("New start time in seconds"),
      endTime: z.number().positive().optional().describe("New end time in seconds"),
    },
    async ({ subtitleId, text, startTime, endTime }) =>
      run(() => {
        store.updateSubtitle(subtitleId, text, startTime, endTime);
        return { updated: true, subtitleId };
      }),
  );

  server.tool(
    "remove_subtitle",
    "Remove a subtitle from the timeline.",
    {
      subtitleId: z.string().describe("ID of the subtitle to remove"),
    },
    async ({ subtitleId }) =>
      run(() => {
        store.removeSubtitle(subtitleId);
        return { removed: true, subtitleId };
      }),
  );

  server.tool(
    "set_subtitle_style",
    "Set the global subtitle style applied to all subtitles (font, color, position, animation).",
    {
      style: subtitleStyleSchema.describe("Subtitle style properties"),
    },
    async ({ style }) =>
      run(() => {
        store.setSubtitleStyle(style as Parameters<typeof store.setSubtitleStyle>[0]);
        return { updated: true, style };
      }),
  );

  server.tool(
    "import_srt",
    "Import subtitles from SRT format. Provide either raw SRT content or a file path.",
    {
      srtContent: z.string().optional().describe("Raw SRT file content as a string"),
      filePath: z.string().optional().describe("Absolute path to an .srt file on disk"),
    },
    async ({ srtContent, filePath }) =>
      run(async () => {
        let content: string;
        if (srtContent) {
          content = srtContent;
        } else if (filePath) {
          content = await readFile(filePath, "utf-8");
        } else {
          throw new Error("Either srtContent or filePath must be provided");
        }
        const count = store.importSrt(content);
        return { imported: count, message: `Imported ${count} subtitle entries` };
      }),
  );

  server.tool(
    "list_caption_animation_styles",
    "List the available caption animation styles for subtitles.",
    {},
    async () =>
      run(() =>
        CAPTION_ANIMATION_STYLES.map((style) => ({
          id: style,
          description:
            style === "none"
              ? "No animation — static text"
              : style === "word-highlight"
              ? "Highlight each word as it is spoken"
              : style === "word-by-word"
              ? "Reveal words one at a time"
              : style === "karaoke"
              ? "Karaoke-style colour sweep through words"
              : style === "bounce"
              ? "Words bounce in from below"
              : "Typewriter character-by-character reveal",
        })),
      ),
  );
}
