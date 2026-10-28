import { createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types";
import type { Json } from "@/integrations/supabase/types";

export type AdminCtx = { userId: string; email: string; roles: AppRole[] };
export const AdminContext = createContext<AdminCtx>({ userId: "", email: "", roles: [] });
export const useAdmin = () => useContext(AdminContext);
export const isAdminRole = (r: AppRole[]) => r.includes("super_admin") || r.includes("admin");

export async function logActivity(action: string, entity: string, entityId: string | null, details: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("activity_logs").insert({
    user_id: data.user.id,
    action,
    entity,
    entity_id: entityId,
    details: details as Json,
  });
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("sign");
  return data.signedUrl;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const rowTint: Record<string, string> = {
  pending: "bg-tint-pending",
  confirmed: "bg-tint-confirmed",
  in_production: "bg-tint-progress",
  shipped: "bg-tint-progress",
  delivered: "bg-tint-delivered",
  cancelled: "bg-tint-cancelled",
  collecting: "bg-tint-pending",
  target_reached: "bg-tint-confirmed",
};
