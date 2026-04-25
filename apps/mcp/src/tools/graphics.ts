import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";
import type { ShapeClip, BlendMode } from "../types.js";

const SHAPE_TYPES = [
  "rectangle",
  "circle",
  "ellipse",
  "triangle",
  "arrow",
  "line",
  "polygon",
  "star",
] as const;

const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
] as const;

const fillStyleSchema = z.object({
  type: z.enum(["solid", "gradient", "none"]).default("solid"),
  color: z.string().optional().describe("CSS color string"),
  opacity: z.number().min(0).max(1).default(1),
});

const strokeStyleSchema = z.object({
  color: z.string().default("#000000"),
  width: z.number().min(0).default(0),
  opacity: z.number().min(0).max(1).default(1),
});

export function registerGraphicsTools(server: McpServer): void {
  server.tool(
    "list_shape_types",
    "List all available shape types with their default style configurations.",
    {},
    async () =>
      run(() =>
        SHAPE_TYPES.map((type) => ({
          type,
          description:
            type === "rectangle" ? "Rectangle / rounded rectangle" :
            type === "circle" ? "Perfect circle" :
            type === "ellipse" ? "Ellipse / oval" :
            type === "triangle" ? "Triangle" :
            type === "arrow" ? "Arrow with head and tail" :
            type === "line" ? "Straight line" :
            type === "polygon" ? "Regular polygon (configurable sides)" :
            "Star shape (configurable points and inner radius)",
          defaultStyle: {
            fill: { type: "solid", color: "#3b82f6", opacity: 1 },
            stroke: { color: "#1d4ed8", width: 2, opacity: 1 },
          },
        })),
      ),
  );

  server.tool(
    "add_shape_clip",
    "Add a shape graphic to a graphics track. Returns the new shape clip's ID.",
    {
      trackId: z.string().describe("ID of the graphics track (must have type 'graphics')"),
      startTime: z.number().min(0).describe("Start time in seconds"),
      duration: z.number().positive().describe("Duration in seconds"),
      shapeType: z.enum(SHAPE_TYPES).describe("Shape type"),
      fill: fillStyleSchema.optional().describe("Fill style"),
      stroke: strokeStyleSchema.optional().describe("Stroke style"),
      cornerRadius: z.number().min(0).optional().describe("Corner radius in pixels (rectangles only)"),
      points: z.number().int().min(3).optional().describe("Number of points for star/polygon shapes"),
      innerRadius: z.number().min(0).max(1).optional().describe("Inner radius ratio for star shapes (0–1)"),
    },
    async ({ trackId, startTime, duration, shapeType, fill, stroke, cornerRadius, points, innerRadius }) =>
      run(() => {
        const style = {
          fill: fill ? { type: fill.type, color: fill.color, opacity: fill.opacity } : undefined,
          stroke: stroke ? { color: stroke.color, width: stroke.width, opacity: stroke.opacity } : undefined,
          cornerRadius,
          points,
          innerRadius,
        } as Partial<ShapeClip["style"]>;
        const id = store.addShapeClip(trackId, startTime, duration, shapeType, style);
        return { id, trackId, startTime, duration, shapeType };
      }),
  );

  server.tool(
    "list_stickers",
    "List available sticker and emoji categories for use in graphics tracks.",
    {},
    async () =>
      run(() => ({
        stickerCategories: [
          { id: "shapes", name: "Shapes", description: "Basic geometric shapes" },
          { id: "arrows", name: "Arrows", description: "Arrow indicators" },
          { id: "frames", name: "Frames", description: "Decorative frames and borders" },
          { id: "badges", name: "Badges", description: "Labels and badges" },
          { id: "social", name: "Social Media", description: "Platform icons and elements" },
        ],
        emojiCategories: [
          { id: "smileys", name: "Smileys & Emotion" },
          { id: "people", name: "People & Body" },
          { id: "animals", name: "Animals & Nature" },
          { id: "food", name: "Food & Drink" },
          { id: "activities", name: "Activities" },
          { id: "travel", name: "Travel & Places" },
          { id: "objects", name: "Objects" },
          { id: "symbols", name: "Symbols" },
          { id: "flags", name: "Flags" },
        ],
        note: "To add emoji or sticker clips, place the emoji/sticker image URL as a StickerClip via the web app. The MCP server supports shape clips directly.",
      })),
  );

  server.tool(
    "list_blend_modes",
    "List all available blend modes for clips and graphics layers.",
    {},
    async () =>
      run(() =>
        BLEND_MODES.map((mode) => ({
          id: mode as BlendMode,
          description:
            mode === "normal" ? "Standard compositing (no blending)" :
            mode === "multiply" ? "Darkens by multiplying colours" :
            mode === "screen" ? "Lightens by inverting, multiplying, inverting again" :
            mode === "overlay" ? "Combines multiply and screen based on base colour" :
            mode === "darken" ? "Keeps darkest channel values" :
            mode === "lighten" ? "Keeps lightest channel values" :
            mode === "color-dodge" ? "Brightens base to reflect blend colour" :
            mode === "color-burn" ? "Darkens base to reflect blend colour" :
            mode === "hard-light" ? "Overlay with swapped layers" :
            mode === "soft-light" ? "Subtle overlay (softer than hard-light)" :
            mode === "difference" ? "Subtracts colours to create inverted effect" :
            mode === "exclusion" ? "Similar to difference but lower contrast" :
            mode === "hue" ? "Hue of blend with luminosity/saturation of base" :
            mode === "saturation" ? "Saturation of blend with luminosity/hue of base" :
            mode === "color" ? "Hue and saturation of blend with luminosity of base" :
            "Luminosity of blend with hue/saturation of base",
        })),
      ),
  );
}
