export interface RealSiteTarget {
  id: string;
  url: string;
  rationale: string;
}

export const REAL_SITE_TARGETS: readonly RealSiteTarget[] = [
  {
    id: "playwright-todomvc",
    url: "https://demo.playwright.dev/todomvc/",
    rationale: "Public SPA used in Playwright's own documentation; observed without mutations.",
  },
  {
    id: "the-internet-challenging-dom",
    url: "https://the-internet.herokuapp.com/challenging_dom",
    rationale: "Public browser-testing fixture with generated/changing DOM implementation details.",
  },
  {
    id: "the-internet-dynamic-content",
    url: "https://the-internet.herokuapp.com/dynamic_content",
    rationale: "Public browser-testing fixture with reload-driven content churn.",
  },
] as const;
