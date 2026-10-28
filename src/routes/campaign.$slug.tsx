import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BRAND, S } from "@/lib/strings.bn";
import { bnDate, bnNum, money } from "@/lib/format";
import { campaignQuery, siteQuery } from "@/lib/public.functions";
import { SiteLayout } from "@/components/SiteLayout";
import { Badge, Card, Countdown, ProgressBar, Timeline } from "@/components/brutal";
import { CampaignImage } from "@/components/CampaignImage";
import { OrderForm } from "@/components/OrderForm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/campaign/$slug")({
  loader: async ({ context, params }) => {
    const [c] = await Promise.all([
      context.queryClient.ensureQueryData(campaignQuery(params.slug)),
      context.queryClient.ensureQueryData(siteQuery),
    ]);
    if (!c) throw notFound();
    return { title: c.title, desc: c.description.slice(0, 155), image: c.images[0] ?? null };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: `${S.meta.campaignNotFound} — ${BRAND}` }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.title} — ${BRAND}`;
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData.desc },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData.desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData.image?.startsWith("https://")
          ? [
              { property: "og:image", content: loaderData.image },
              { name: "twitter:image", content: loaderData.image },
            ]
          : []),
      ],
    };
  },
  component: CampaignPage,
});

function CampaignPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const { data: c } = useSuspenseQuery(campaignQuery(slug));
  const { data: site } = useSuspenseQuery(siteQuery);
  const [img, setImg] = useState(0);

  useEffect(() => {
    if (!c) return;
    const ch = supabase
      .channel(`campaign-${c.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${c.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["campaign", slug] });
        qc.invalidateQueries({ queryKey: ["campaigns"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [c?.id, slug, qc]);

  if (!c) return null;
  const methods = site.settings.payment_methods?.length
    ? site.settings.payment_methods
    : [{ id: "cod", label: "ক্যাশ অন ডেলিভারি", instructions: "" }];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link to="/campaigns" className="font-bold underline decoration-[3px] underline-offset-4">
          {S.campaign.back}
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="brutal aspect-square overflow-hidden p-0">
              <CampaignImage src={c.images[img]} title={c.title} />
            </div>
            {c.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {c.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setImg(i)}
                    className={cn("size-20 shrink-0 border-[3px] border-ink", i === img && "shadow-[4px_4px_0_var(--ink)]")}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={c.status}>{S.campaignStatus[c.status]}</Badge>
              <Badge tone="cancelled">● {S.campaign.live}</Badge>
              <Badge tone="confirmed">{S.campaign.digital}</Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl">{c.title}</h1>
            <p className="whitespace-pre-line text-lg">{c.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <InfoBox label={S.campaign.price} value={money(c.price)} tone="bg-primary text-primary-foreground" />
              <InfoBox
                label={Number(c.advance_amount) > 0 ? S.campaign.advance : S.campaign.fullPayment}
                value={money(Number(c.advance_amount) > 0 ? c.advance_amount : c.price)}
              />
              <InfoBox label={S.campaign.estDelivery} value={bnDate(c.est_delivery_at)} />
              <InfoBox label={S.campaign.deadline} value={bnDate(c.deadline_at)} />
            </div>
            <Card>
              <p className="mb-2 font-mono text-xs font-bold">{S.campaign.progress}</p>
              <ProgressBar counted={c.progress.counted_qty} target={c.target_qty} size="lg" />
              <p className="mt-3 text-lg font-bold text-accent">
                {c.progress.remaining > 0 ? `🔥 ${S.campaign.spotsLeft(bnNum(c.progress.remaining))}` : S.campaign.full}
              </p>
              <p className="text-sm text-muted-foreground">{S.campaign.perOrderMax(bnNum(c.max_per_order))}</p>
            </Card>
            {c.status === "collecting" && c.deadline_at && <Countdown to={c.deadline_at} />}
          </div>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl">{S.campaign.statusTitle}</h2>
          <Timeline status={c.status} />
          {c.public_note && (
            <p className="mt-3 border-[3px] border-ink bg-info p-3 font-bold text-info-foreground">
              {S.campaign.note}: {c.public_note}
            </p>
          )}
        </section>

        <section className="mx-auto mt-10 max-w-2xl" id="order">
          <OrderForm c={c} methods={methods} onDone={() => qc.invalidateQueries({ queryKey: ["campaign", slug] })} />
        </section>
      </div>
    </SiteLayout>
  );
}

function InfoBox({ label, value, tone = "bg-card" }: { label: string; value: string; tone?: string }) {
  return (
    <div className={cn("border-[3px] border-ink p-3", tone)}>
      <p className="font-mono text-xs font-bold">{label}</p>
      <p className="font-mono text-xl font-extrabold">{value}</p>
    </div>
  );
}
