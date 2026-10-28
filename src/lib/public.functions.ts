import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import type { CampaignWithProgress, Faq, Progress, SiteSettings } from "@/types";

async function publicClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

async function loadProgress(sb: Awaited<ReturnType<typeof publicClient>>) {
  const { data, error } = await sb.rpc("campaign_progress");
  if (error) throw new Error(error.message);
  const map = new Map<string, Progress>();
  for (const p of (data ?? []) as Progress[]) map.set(p.campaign_id, { ...p, percent: Number(p.percent) });
  return map;
}

const emptyProgress = (id: string, target: number): Progress => ({
  campaign_id: id,
  target_qty: target,
  counted_qty: 0,
  remaining: target,
  percent: 0,
});

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await publicClient();
  const [s, f] = await Promise.all([
    sb.from("site_settings").select("data").eq("id", 1).maybeSingle(),
    sb.from("faqs").select("*").order("sort_order"),
  ]);
  return { settings: (s.data?.data ?? {}) as unknown as SiteSettings, faqs: (f.data ?? []) as Faq[] };
});

export const listCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await publicClient();
  const { data, error } = await sb
    .from("campaigns")
    .select("*")
    .eq("visibility", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const prog = await loadProgress(sb);
  return (data ?? []).map((c) => ({ ...c, progress: prog.get(c.id) ?? emptyProgress(c.id, c.target_qty) })) as CampaignWithProgress[];
});

export const getCampaign = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 200) }))
  .handler(async ({ data }) => {
    const sb = await publicClient();
    const { data: c } = await sb.from("campaigns").select("*").eq("slug", data.slug).eq("visibility", "published").maybeSingle();
    if (!c) return null;
    const prog = await loadProgress(sb);
    return { ...c, progress: prog.get(c.id) ?? emptyProgress(c.id, c.target_qty) } as CampaignWithProgress;
  });

export const siteQuery = queryOptions({ queryKey: ["site"], queryFn: () => getSiteData(), staleTime: 60_000 });
export const campaignsQuery = queryOptions({ queryKey: ["campaigns"], queryFn: () => listCampaigns() });
export const campaignQuery = (slug: string) =>
  queryOptions({ queryKey: ["campaign", slug], queryFn: () => getCampaign({ data: { slug } }) });
