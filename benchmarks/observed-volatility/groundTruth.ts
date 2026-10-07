export const OBSERVED_VOLATILITY_EVALUATION_CASES = [
  {
    id: "held-out-title-volatility",
    left: "#title-eval-a",
    right: "#title-eval-b",
    expected: "same",
    rationale: "Unseen Dashboard title values should follow the trusted title-volatility rule learned from separate observations of the same anchor.",
  },
  {
    id: "held-out-query-volatility",
    left: "?refreshToken=C31#query-dashboard",
    right: "?refreshToken=D44#query-dashboard",
    expected: "same",
    rationale: "Unseen refreshToken values should follow the trusted query-volatility rule learned from separate observations of the same anchor.",
  },
  {
    id: "meaningful-auction-seconds",
    left: "#auction-a",
    right: "#auction-b",
    expected: "different",
    rationale: "The Dashboard title-volatility rule must not leak into the Auction anchor.",
  },
  {
    id: "meaningful-invoice-refresh-token",
    left: "?refreshToken=invoice-41#invoice",
    right: "?refreshToken=invoice-42#invoice",
    expected: "different",
    rationale: "The Dashboard refreshToken rule must not leak into the Invoice anchor.",
  },
  {
    id: "semantic-ref-query",
    left: "?ref=invoice-41#invoice",
    right: "?ref=invoice-42#invoice",
    expected: "different",
    rationale: "ref remains semantic unless separately supported by scoped volatility evidence.",
  },
  {
    id: "known-tracking-query",
    left: "#query-dashboard",
    right: "?utm_source=phase9#query-dashboard",
    expected: "same",
    rationale: "Previously established tracking-query normalization remains intact.",
  },
] as const;
