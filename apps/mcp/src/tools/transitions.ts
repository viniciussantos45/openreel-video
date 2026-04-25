import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { store } from "../project-store.js";
import { run } from "../utils/response.js";
import { TRANSITION_PRESETS } from "../constants.js";
import type { TransitionType } from "../types.js";

const TRANSITION_TYPE_VALUES = [
  "crossfade",
  "dipToBlack",
  "dipToWhite",
  "wipe",
  "slide",
  "zoom",
  "push",
] as const;

export function registerTransitionTools(server: McpServer): void {
  server.tool(
    "list_transition_presets",
    "List all built-in transition presets with their IDs, names, categories, and default durations.",
    {},
    async () => run(() => TRANSITION_PRESETS),
  );

  server.tool(
    "get_transition_types",
    "Get the available transition types and their parameter options.",
    {},
    async () =>
      run(() => ({
        types: TRANSITION_TYPE_VALUES,
        details: {
          crossfade: { description: "Smooth blend between clips", params: { curve: "linear | ease | ease-in | ease-out" } },
          dipToBlack: { description: "Fade through black", params: { holdDuration: "seconds to hold at full black" } },
          dipToWhite: { description: "Fade through white", params: { holdDuration: "seconds to hold at full white" } },
          wipe: { description: "Wipe from one clip to another", params: { direction: "left|right|up|down|diagonal", softness: "0–1" } },
          slide: { description: "Slide clip in/out", params: { direction: "left|right|up|down", pushOut: "boolean" } },
          zoom: { description: "Zoom transition", params: { scale: "final scale factor", center: "{x,y} normalized 0–1" } },
          push: { description: "Push previous clip out", params: { direction: "left|right|up|down" } },
        },
      })),
  );

  server.tool(
    "add_transition",
    "Add a transition between two clips on the same track. Returns the transition ID.",
    {
      clipAId: z.string().describe("ID of the outgoing clip"),
      clipBId: z.string().describe("ID of the incoming clip"),
      transitionType: z.enum(TRANSITION_TYPE_VALUES).describe("Type of transition"),
      duration: z.number().positive().describe("Transition duration in seconds"),
    },
    async ({ clipAId, clipBId, transitionType, duration }) =>
      run(() => {
        const transitionId = store.addTransition(clipAId, clipBId, transitionType as TransitionType, duration);
        return { transitionId, clipAId, clipBId, transitionType, duration };
      }),
  );

  server.tool(
    "remove_transition",
    "Remove a transition between clips.",
    {
      transitionId: z.string().describe("ID of the transition to remove"),
    },
    async ({ transitionId }) =>
      run(() => {
        store.removeTransition(transitionId);
        return { removed: true, transitionId };
      }),
  );

  server.tool(
    "update_transition",
    "Update a transition's duration and/or parameters.",
    {
      transitionId: z.string().describe("ID of the transition"),
      duration: z.number().positive().optional().describe("New duration in seconds"),
      params: z.record(z.unknown()).optional().describe("Additional type-specific parameters"),
    },
    async ({ transitionId, duration, params }) =>
      run(() => {
        store.updateTransition(transitionId, duration, params as Record<string, unknown>);
        return { updated: true, transitionId, duration, params };
      }),
  );
}
