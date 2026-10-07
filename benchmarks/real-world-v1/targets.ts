export interface RealWorldTarget {
  id: string;
  name: string;
  url: string;
  category:
    | "spa-local-state"
    | "async-controls"
    | "visibility-mutation";
  runs: number;
  maxTransitions: number;
  rationale: string;
}

export const PHASE19_REAL_WORLD_TARGETS: readonly RealWorldTarget[] = [
  {
    id: "todomvc-react",
    name: "TodoMVC React",
    url: "https://todomvc.com/examples/react/dist/",
    category: "spa-local-state",
    runs: 3,
    maxTransitions: 6,
    rationale:
      "Maintained public TodoMVC React example; useful for same-page SPA controls, hash navigation, and local client-side state.",
  },
  {
    id: "the-internet-dynamic-controls",
    name: "The Internet — Dynamic Controls",
    url: "https://the-internet.herokuapp.com/dynamic_controls",
    category: "async-controls",
    runs: 3,
    maxTransitions: 6,
    rationale:
      "Public UI testing fixture with asynchronous enable/remove controls and an explicit destructive label that exercises conservative policy blocking.",
  },
  {
    id: "ui-testing-playground-visibility",
    name: "UI Testing Playground — Visibility",
    url: "https://uitestingplayground.com/visibility",
    category: "visibility-mutation",
    runs: 3,
    maxTransitions: 6,
    rationale:
      "Public automation fixture where a safe Hide action changes visibility of several controls using different hiding mechanisms.",
  },
] as const;

export const PHASE19_PROTOCOL = {
  browser: "chromium",
  navigationTimeoutMs: 15_000,
  actionTimeoutMs: 10_000,
  freshBrowserContextPerRun: true,
  actionPolicy: "statescout-default-safe-only",
  identity: "v4-empty-profile",
  externalGroundTruth: false,
  minimumSuccessfulRunsForStability: 2,
} as const;
