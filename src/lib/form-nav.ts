import type { KeyboardEvent } from "react";

const SEL = "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])";

/** Enter → next field, Escape → previous field, Enter on last → submit. Textareas use Ctrl+Enter. */
export function formKeyNav(e: KeyboardEvent<HTMLFormElement>) {
  const t = e.target as HTMLElement;
  if (!(t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement)) return;
  if (t instanceof HTMLInputElement && (t.type === "checkbox" || t.type === "radio" || t.type === "file") && e.key === "Enter") {
    // fallthrough to move next
  }
  const fields = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(SEL)).filter((el) => el.offsetParent !== null);
  const i = fields.indexOf(t);
  if (i < 0) return;
  if (e.key === "Escape") {
    if (i > 0) {
      e.preventDefault();
      fields[i - 1]?.focus();
    }
    return;
  }
  if (e.key !== "Enter") return;
  if (t instanceof HTMLTextAreaElement && !e.ctrlKey) return;
  e.preventDefault();
  if (i < fields.length - 1) fields[i + 1]?.focus();
  else e.currentTarget.requestSubmit();
}
