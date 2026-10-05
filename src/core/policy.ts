import type { ActionRisk, Interaction, SemanticTarget } from "./model.js";

export interface CrawlBoundaryPolicy {
  mode: "same-origin";
  startUrl: string;
}

export interface ActionExecutionPolicy {
  allowMutating: boolean;
  allowDestructive: boolean;
  allowUnknown: boolean;
}

export const DEFAULT_ACTION_POLICY: ActionExecutionPolicy = {
  allowMutating: false,
  allowDestructive: false,
  allowUnknown: false,
};

const DESTRUCTIVE_TERMS = [
  "delete",
  "remove",
  "destroy",
  "erase",
  "terminate",
  "cancel subscription",
  "close account",
  "pay",
  "purchase",
  "checkout",
  "send money",
  "transfer",
  "publish",
] as const;

const MUTATING_TERMS = [
  "save",
  "create",
  "add",
  "submit",
  "update",
  "edit",
  "upload",
  "invite",
  "send",
  "confirm",
] as const;

function searchableTargetText(target: SemanticTarget): string {
  return [
    target.role,
    target.name,
    target.label,
    target.text,
    target.href,
    target.inputType,
    target.context,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

export function classifyInteractionRisk(target: SemanticTarget): ActionRisk {
  const text = searchableTargetText(target);

  if (DESTRUCTIVE_TERMS.some((term) => text.includes(term))) {
    return "destructive";
  }

  if (MUTATING_TERMS.some((term) => text.includes(term))) {
    return "mutating";
  }

  if (
    target.role === "button" ||
    target.role === "link" ||
    target.role === "tab" ||
    target.role === "menuitem"
  ) {
    return "safe";
  }

  return "unknown";
}

export function canExecuteInteraction(
  interaction: Interaction,
  policy: ActionExecutionPolicy = DEFAULT_ACTION_POLICY,
): boolean {
  switch (interaction.risk) {
    case "safe":
      return true;
    case "mutating":
      return policy.allowMutating;
    case "destructive":
      return policy.allowDestructive;
    case "unknown":
      return policy.allowUnknown;
  }
}

export function isUrlAllowed(
  candidateUrl: string,
  policy: CrawlBoundaryPolicy,
): boolean {
  const start = new URL(policy.startUrl);
  const candidate = new URL(candidateUrl, start);

  if (candidate.protocol !== "http:" && candidate.protocol !== "https:") {
    return false;
  }

  return candidate.origin === start.origin;
}
