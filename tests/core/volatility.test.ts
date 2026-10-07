import assert from "node:assert/strict";
import test from "node:test";

import type { SemanticStateSnapshot } from "../../src/core/model.ts";
import {
  createVolatilityProfile,
  hasTrustedVolatilityRule,
  learnScopedVolatilityRule,
} from "../../src/core/volatility.ts";

const base: SemanticStateSnapshot = {
  origin: "https://fixture.statescout.test",
  path: "/dashboard",
  query: {},
  title: "Dashboard — A",
  headings: ["Dashboard"],
  landmarks: ["main"],
  dialogs: [],
  controls: [{ role: "button", name: "Open menu" }],
};

test("volatility rule requires a stable protected semantic anchor", () => {
  assert.throws(
    () =>
      learnScopedVolatilityRule(
        [
          base,
          {
            ...base,
            title: "Dashboard — B",
            headings: ["Different state"],
          },
        ],
        "title",
      ),
    /protected semantic anchor changed/,
  );
});

test("trusted volatility rule is scoped to its learned anchor", () => {
  const rule = learnScopedVolatilityRule(
    [base, { ...base, title: "Dashboard — B" }],
    "title",
  );
  const profile = createVolatilityProfile([rule]);

  assert.equal(
    hasTrustedVolatilityRule(profile, { ...base, title: "Dashboard — C" }, "title"),
    true,
  );
  assert.equal(
    hasTrustedVolatilityRule(
      profile,
      {
        ...base,
        title: "Auction closes — 10:00:01",
        headings: ["Auction"],
        controls: [{ role: "button", name: "Place bid" }],
      },
      "title",
    ),
    false,
  );
});
