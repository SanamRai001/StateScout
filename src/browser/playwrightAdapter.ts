import { createHash } from "node:crypto";

import type { Page } from "playwright";

import type {
  Interaction,
  LocatorCandidate,
  SemanticControl,
  SemanticStateSnapshot,
  SemanticTarget,
} from "../core/model.ts";
import { classifyInteractionRisk } from "../core/policy.ts";

interface ObservedControl {
  role: string;
  name?: string;
  label?: string;
  value?: string;
  selected?: boolean;
  expanded?: boolean;
  checked?: boolean;
  disabled?: boolean;
  context?: string;
  text?: string;
  testId?: string;
  href?: string;
  inputType?: string;
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ""),
  ) as T;
}

function interactionId(kind: Interaction["kind"], target: SemanticTarget): string {
  const canonical = JSON.stringify([kind, target.role, target.name, target.label, target.text, target.testId, target.href]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
}

function locatorCandidates(control: ObservedControl): LocatorCandidate[] {
  const candidates: LocatorCandidate[] = [];
  if (control.role && control.name) candidates.push({ strategy: "role", value: JSON.stringify([control.role, control.name]), score: 1 });
  if (control.label) candidates.push({ strategy: "label", value: control.label, score: 0.95 });
  if (control.testId) candidates.push({ strategy: "test-id", value: control.testId, score: 0.9 });
  if (control.text) candidates.push({ strategy: "text", value: control.text, score: 0.75 });
  return candidates;
}

export async function observePage(page: Page): Promise<SemanticStateSnapshot> {
  const observed = await page.locator("body").evaluate(() => {
    const text = (value: string | null | undefined) => value?.replace(/\s+/g, " ").trim() || undefined;
    const visible = (element: Element) => {
      const html = element as HTMLElement;
      const style = getComputedStyle(html);
      const rect = html.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const nameFor = (element: Element) => {
      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        const value = labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
        if (text(value)) return text(value);
      }
      return text(element.getAttribute("aria-label")) ?? text(element.textContent);
    };
    const roleFor = (element: Element) => element.getAttribute("role") ?? (
      element.tagName === "BUTTON" ? "button" :
      element.tagName === "A" ? "link" :
      element.tagName === "SELECT" ? "combobox" :
      element.tagName === "TEXTAREA" ? "textbox" :
      element.tagName === "INPUT" ? ((element as HTMLInputElement).type === "checkbox" ? "checkbox" : "textbox") :
      "control"
    );

    const controls = Array.from(document.querySelectorAll("button,a[href],input,select,textarea,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox]"))
      .filter(visible)
      .map((element) => {
        const input = element as HTMLInputElement;
        const anchor = element as HTMLAnchorElement;
        return {
          role: roleFor(element),
          name: nameFor(element),
          label: text(element.getAttribute("aria-label")),
          value: "value" in input ? text(input.value) : undefined,
          selected: element.getAttribute("aria-selected") === null ? undefined : element.getAttribute("aria-selected") === "true",
          expanded: element.getAttribute("aria-expanded") === null ? undefined : element.getAttribute("aria-expanded") === "true",
          checked: "checked" in input ? input.checked : undefined,
          disabled: "disabled" in input ? input.disabled : element.getAttribute("aria-disabled") === "true" || undefined,
          text: text(element.textContent),
          testId: text(element.getAttribute("data-testid")),
          href: anchor.href || undefined,
          inputType: element.tagName === "INPUT" ? input.type : undefined,
          context: text(element.parentElement?.getAttribute("aria-label")),
        };
      });

    const landmarks = Array.from(document.querySelectorAll("main,nav,aside,header,footer,[role=banner],[role=navigation],[role=main],[role=complementary],[role=contentinfo]"))
      .filter(visible)
      .map((element) => text(element.getAttribute("aria-label")) ?? element.getAttribute("role") ?? element.tagName.toLowerCase())
      .filter((value): value is string => Boolean(value));

    return {
      title: text(document.title),
      headings: Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).filter(visible).map((element) => text(element.textContent)).filter((value): value is string => Boolean(value)),
      landmarks,
      dialogs: Array.from(document.querySelectorAll("dialog,[role=dialog],[role=alertdialog]")).filter(visible).map((element) => nameFor(element)).filter((value): value is string => Boolean(value)),
      controls,
    };
  });

  const url = new URL(page.url());
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams) {
    const existing = query[key];
    query[key] = existing === undefined ? value : Array.isArray(existing) ? [...existing, value] : [existing, value];
  }

  return {
    origin: url.origin,
    path: url.pathname,
    query,
    ...(observed.title ? { title: observed.title } : {}),
    headings: observed.headings,
    landmarks: observed.landmarks,
    dialogs: observed.dialogs,
    controls: observed.controls.map((control) => compact({
      role: control.role,
      name: control.name,
      label: control.label,
      value: control.value,
      selected: control.selected,
      expanded: control.expanded,
      checked: control.checked,
      disabled: control.disabled,
      context: control.context,
    }) as SemanticControl),
  };
}

export async function discoverInteractions(page: Page): Promise<Interaction[]> {
  const controls = await page.locator("button,a[href],[role=button],[role=link],[role=tab],[role=menuitem]").evaluateAll((elements) =>
    elements.map((element) => {
      const html = element as HTMLElement;
      const style = getComputedStyle(html);
      const rect = html.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return null;
      const role = element.getAttribute("role") ?? (element.tagName === "A" ? "link" : "button");
      const name = element.getAttribute("aria-label")?.trim() || element.textContent?.replace(/\s+/g, " ").trim() || undefined;
      return { role, name, text: element.textContent?.replace(/\s+/g, " ").trim() || undefined, testId: element.getAttribute("data-testid") ?? undefined, href: (element as HTMLAnchorElement).href || undefined };
    }).filter((value) => value !== null),
  ) as ObservedControl[];

  return controls.map((control) => {
    const target = compact({ role: control.role, name: control.name, text: control.text, testId: control.testId, href: control.href }) as SemanticTarget;
    const kind: Interaction["kind"] = control.role === "link" && control.href ? "navigate" : "click";
    return {
      id: interactionId(kind, target),
      kind,
      risk: classifyInteractionRisk(target),
      target,
      locatorCandidates: locatorCandidates(control),
    };
  });
}

export async function executeInteraction(page: Page, interaction: Interaction): Promise<void> {
  const role = interaction.target.role;
  const name = interaction.target.name;
  if (role && name) {
    await page.getByRole(role as Parameters<Page["getByRole"]>[0], { name, exact: true }).first().click();
    return;
  }
  if (interaction.target.testId) {
    await page.getByTestId(interaction.target.testId).first().click();
    return;
  }
  if (interaction.target.text) {
    await page.getByText(interaction.target.text, { exact: true }).first().click();
    return;
  }
  throw new Error(`No executable locator for interaction ${interaction.id}`);
}
