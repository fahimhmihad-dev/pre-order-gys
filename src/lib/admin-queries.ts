import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CampaignWithProgress, Order, Progress, SiteSettings } from "@/types";

export const adminCampaignsQuery = queryOptions({
  queryKey: ["admin", "campaigns"],
  queryFn: async (): Promise<CampaignWithProgress[]> => {
    const [{ data, error }, { data: prog }] = await Promise.all([
      supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
      supabase.rpc("campaign_progress"),
    ]);
    if (error) throw error;
    const map = new Map((prog as Progress[] | null)?.map((p) => [p.campaign_id, { ...p, percent: Number(p.percent) }]) ?? []);
    return (data ?? []).map((c) => ({
      ...c,
      progress: map.get(c.id) ?? { campaign_id: c.id, target_qty: c.target_qty, counted_qty: 0, remaining: c.target_qty, percent: 0 },
    }));
  },
});

export const adminOrdersQuery = queryOptions({
  queryKey: ["admin", "orders"],
  queryFn: async (): Promise<Order[]> => {
    const all: Order[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).range(from, from + 999);
      if (error) throw error;
      all.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    return all;
  },
});

export const adminSettingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: async () => {
    const { data } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
    return (data?.data ?? {}) as unknown as SiteSettings;
  },
});
