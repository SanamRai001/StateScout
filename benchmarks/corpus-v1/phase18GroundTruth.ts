export const PHASE18_EXPECTED_METRICS = {
  "url-only": {
    correct: 5,
    accuracy: 0.3125,
    falseMerges: 10,
    falseSplits: 1,
  },
  v1: {
    correct: 13,
    accuracy: 0.8125,
    falseMerges: 2,
    falseSplits: 1,
  },
  v2: {
    correct: 13,
    accuracy: 0.8125,
    falseMerges: 3,
    falseSplits: 0,
  },
  v3: {
    correct: 13,
    accuracy: 0.8125,
    falseMerges: 3,
    falseSplits: 0,
  },
  v4: {
    correct: 14,
    accuracy: 0.875,
    falseMerges: 2,
    falseSplits: 0,
  },
  "v4-no-controls": {
    correct: 9,
    accuracy: 0.5625,
    falseMerges: 7,
    falseSplits: 0,
  },
  "v4-no-title": {
    correct: 13,
    accuracy: 0.8125,
    falseMerges: 3,
    falseSplits: 0,
  },
  "v4-no-query": {
    correct: 13,
    accuracy: 0.8125,
    falseMerges: 3,
    falseSplits: 0,
  },
  "v4-targeted-content": {
    correct: 16,
    accuracy: 1,
    falseMerges: 0,
    falseSplits: 0,
  },
} as const;

export const PHASE18_EXPECTED_FAILURES = {
  "url-only": [
    "known-tracking-query-noise",
    "selected-tab-state",
    "expanded-panel-state",
    "checkbox-state",
    "disabled-control-state",
    "input-value-state",
    "dialog-open-state",
    "dialog-identity-state",
    "meaningful-second-title",
    "plain-status-text-state",
    "list-content-state",
  ],
  v1: [
    "known-tracking-query-noise",
    "plain-status-text-state",
    "list-content-state",
  ],
  v2: [
    "meaningful-second-title",
    "plain-status-text-state",
    "list-content-state",
  ],
  v3: [
    "meaningful-second-title",
    "plain-status-text-state",
    "list-content-state",
  ],
  v4: [
    "plain-status-text-state",
    "list-content-state",
  ],
  "v4-no-controls": [
    "selected-tab-state",
    "expanded-panel-state",
    "checkbox-state",
    "disabled-control-state",
    "input-value-state",
    "plain-status-text-state",
    "list-content-state",
  ],
  "v4-no-title": [
    "meaningful-second-title",
    "plain-status-text-state",
    "list-content-state",
  ],
  "v4-no-query": [
    "semantic-record-query",
    "plain-status-text-state",
    "list-content-state",
  ],
  "v4-targeted-content": [],
} as const;

export const PHASE18_FROZEN_INTERPRETATION = {
  totalCases: 16,
  strongestExistingIdentity: "v4",
  strongestExistingCorrect: 14,
  targetedContentCorrect: 16,
  controlsAblationCorrect: 9,
  note:
    "Targeted visible status/list content is an experimental observer augmentation for ablation only; Phase 18 does not replace the production observer or define fingerprint v5.",
} as const;
