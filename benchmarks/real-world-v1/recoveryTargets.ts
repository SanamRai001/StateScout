import type { RealWorldTarget } from "./targets.ts";

export const PHASE19_RECOVERY_TARGETS: readonly RealWorldTarget[] = [
  {
    id: "w3c-apg-tabs-automatic",
    name: "W3C ARIA APG — Automatic Tabs",
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/",
    category: "accessible-tabs",
    runs: 3,
    maxTransitions: 6,
    rationale:
      "Public W3C interaction example with safe tab controls and explicit aria-selected state changes; added only after Phase 19A lacked enough reachable targets.",
  },
  {
    id: "selenium-web-form",
    name: "Selenium — Web Form",
    url: "https://www.selenium.dev/selenium/web/web-form.html",
    category: "form-policy",
    runs: 3,
    maxTransitions: 6,
    rationale:
      "Official Selenium public automation fixture on a different domain; useful for repeated-run stability and conservative policy behavior around form controls.",
  },
] as const;

export const PHASE19_RECOVERY_PROTOCOL = {
  reason: "phase19a-insufficient-external-evidence",
  preservesPrimaryCohort: true,
  fallbackTargetsChosenBeforeFallbackOutcomes: true,
  minimumCombinedEvaluableTargets: 2,
} as const;
