export type StateId = string;
export type InteractionId = string;
export type TransitionId = string;

export type InteractionKind =
  | "click"
  | "navigate"
  | "fill"
  | "select"
  | "check"
  | "uncheck"
  | "press"
  | "upload";

export type ActionRisk = "safe" | "mutating" | "destructive" | "unknown";

export type LocatorStrategy =
  | "role"
  | "label"
  | "test-id"
  | "text"
  | "placeholder"
  | "attribute"
  | "css"
  | "xpath";

export interface LocatorCandidate {
  strategy: LocatorStrategy;
  value: string;
  score: number;
}

export interface SemanticTarget {
  role?: string;
  name?: string;
  label?: string;
  text?: string;
  testId?: string;
  href?: string;
  inputType?: string;
  context?: string;
}

export interface Interaction {
  id: InteractionId;
  kind: InteractionKind;
  risk: ActionRisk;
  target: SemanticTarget;
  locatorCandidates: readonly LocatorCandidate[];
}

export interface SemanticControl {
  role: string;
  name?: string;
  label?: string;
  value?: string;
  selected?: boolean;
  expanded?: boolean;
  checked?: boolean;
  disabled?: boolean;
  context?: string;
}

export interface SemanticStateSnapshot {
  origin: string;
  path: string;
  query: Readonly<Record<string, string | readonly string[]>>;
  title?: string;
  headings: readonly string[];
  landmarks: readonly string[];
  dialogs: readonly string[];
  controls: readonly SemanticControl[];
}

export interface StateFingerprint {
  algorithm: "statescout-semantic";
  version: 1 | 2 | 3 | 4;
  canonical: string;
  hash: string;
}

export interface StateNode {
  id: StateId;
  fingerprint: StateFingerprint;
  snapshot: SemanticStateSnapshot;
  capturedAt: string;
  screenshotPath?: string;
}

export type TransitionStatus =
  | "observed"
  | "blocked-by-policy"
  | "failed"
  | "no-state-change";

export interface Transition {
  id: TransitionId;
  fromStateId: StateId;
  toStateId?: StateId;
  interaction: Interaction;
  status: TransitionStatus;
  error?: string;
}

export interface ReplayStep {
  interaction: Interaction;
  expectedStateHash: string;
}

export interface StatePath {
  stateId: StateId;
  steps: readonly ReplayStep[];
}
