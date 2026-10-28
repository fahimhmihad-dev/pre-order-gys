const BN = "০১২৩৪৫৬৭৮৯";

export function toBanglaDigits(v: string | number): string {
  return String(v).replace(/[0-9]/g, (d) => BN[Number(d)]);
}

export function toEnglishDigits(v: string): string {
  return v.replace(/[০-৯]/g, (d) => String(BN.indexOf(d)));
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/** dd-mm-yyyy (or dd-mm-yyyy hh:mm AM/PM). English digits; wrap with toBanglaDigits for display. */
export function formatDate(input: string | Date | null | undefined, withTime = false): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  const base = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  if (!withTime) return base;
  let h = d.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${base} ${pad(h)}:${pad(d.getMinutes())} ${ap}`;
}

export function bnDate(input: string | Date | null | undefined, withTime = false) {
  return toBanglaDigits(formatDate(input, withTime));
}

export function bnNum(n: number | string, decimals = 0): string {
  const num = Number(n);
  const s = num.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
  return toBanglaDigits(s);
}

export function money(n: number | string) {
  return `৳${bnNum(n)}`;
}

export const bnCollator = new Intl.Collator("bn");
export const sortBn = <T,>(arr: T[], key: (x: T) => string) =>
  [...arr].sort((a, b) => bnCollator.compare(key(a), key(b)));

export const PHONE_RE = /^01[3-9][0-9]{8}$/;

export function slugify(s: string) {
  const ascii = s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return ascii || `campaign-${Date.now().toString(36)}`;
}

/** Convert Date/ISO to value for <input type="datetime-local"> */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
