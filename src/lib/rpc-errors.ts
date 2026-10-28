import { S } from "@/lib/strings.bn";

export function rpcErrorText(msg: string | undefined): string {
  const m = msg ?? "";
  if (m.includes("OVERBOOK")) {
    const n = m.match(/only (\d+)/)?.[1] ?? "0";
    return S.form.overQty(n.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)] ?? d));
  }
  if (m.includes("BAD_PHONE")) return S.form.badPhone;
  if (m.includes("BAD_EMAIL")) return S.form.badEmail;
  if (m.includes("BAD_NAME")) return S.form.badName;
  if (m.includes("BAD_ADDRESS")) return S.form.badAddress;
  if (m.includes("BAD_TRX")) return S.form.badTrx;
  if (m.includes("BAD_QTY")) return S.form.badQty("");
  if (m.includes("CLOSED") || m.includes("NOT_STARTED") || m.includes("NOT_FOUND")) return S.form.closedError;
  if (m.includes("USER_NOT_FOUND")) return S.admin.users.notFound;
  if (m.includes("FORBIDDEN")) return S.admin.users.onlySuper;
  return S.form.genericError;
}
