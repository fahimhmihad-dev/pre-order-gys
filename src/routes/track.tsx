import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { S } from "@/lib/strings.bn";
import { bnDate, bnNum, toEnglishDigits } from "@/lib/format";
import { formKeyNav } from "@/lib/form-nav";
import { SiteLayout } from "@/components/SiteLayout";
import { Badge, Btn, Card, Field, Input, ProgressBar, Timeline } from "@/components/brutal";
import type { CampaignStatus, OrderStatus, PaymentStatus } from "@/types";

type Tracked = {
  order_code: string;
  customer_name: string;
  quantity: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  campaign: { title: string; slug: string; status: CampaignStatus; public_note: string; target_qty: number; counted_qty: number; est_delivery_at: string | null };
};

export const Route = createFileRoute("/track")({
  validateSearch: (s: Record<string, unknown>): { code?: string; phone?: string } => ({
    ...(typeof s["code"] === "string" ? { code: s["code"] } : {}),
    ...(typeof s["phone"] === "string" ? { phone: s["phone"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: S.meta.trackTitle },
      { name: "description", content: S.meta.trackDesc },
      { property: "og:title", content: S.meta.trackTitle },
      { property: "og:description", content: S.meta.trackDesc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const search = Route.useSearch();
  const [code, setCode] = useState(search.code ?? "");
  const [phone, setPhone] = useState(search.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Tracked | null | undefined>(undefined);

  async function lookup(c = code, p = phone) {
    if (!c.trim() || !p.trim()) return;
    setBusy(true);
    const { data } = await supabase.rpc("track_order", { _code: c.trim(), _phone: p.trim() });
    setBusy(false);
    setRes((data as unknown as Tracked) ?? null);
  }

  useEffect(() => {
    if (search.code && search.phone) lookup(search.code, search.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-4xl">{S.track.title}</h1>
        <Card>
          <form
            onKeyDown={formKeyNav}
            onSubmit={(e) => {
              e.preventDefault();
              lookup();
            }}
            className="grid grid-cols-2 gap-3"
          >
            <Field label={S.track.orderId} htmlFor="t-code">
              <Input id="t-code" value={code} onChange={(e) => setCode(toEnglishDigits(e.target.value).toUpperCase())} placeholder={S.track.orderIdPh} className="font-mono" />
            </Field>
            <Field label={S.track.phone} htmlFor="t-phone">
              <Input id="t-phone" value={phone} onChange={(e) => setPhone(toEnglishDigits(e.target.value))} inputMode="tel" maxLength={11} />
            </Field>
            <Btn type="submit" size="lg" className="col-span-2" disabled={busy}>
              {busy ? S.common.loading : S.track.submit}
            </Btn>
          </form>
        </Card>

        {res === null && <Card className="mt-6 bg-accent text-accent-foreground font-bold">{S.track.notFound}</Card>}
        {res && (
          <div className="mt-6 flex flex-col gap-4">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-2xl font-extrabold">{res.order_code}</span>
                <Link to="/campaign/$slug" params={{ slug: res.campaign.slug }} className="font-bold underline">
                  {res.campaign.title}
                </Link>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Item k={S.track.customer} v={res.customer_name} />
                <Item k={S.track.quantity} v={`${bnNum(res.quantity)}${S.common.pcs}`} />
                <Item k={S.track.orderedOn} v={bnDate(res.created_at)} />
                <Item k={S.campaign.estDelivery} v={bnDate(res.campaign.est_delivery_at)} />
                <div>
                  <dt className="font-mono text-xs font-bold">{S.track.orderStatus}</dt>
                  <dd><Badge tone={res.status}>{S.orderStatus[res.status]}</Badge></dd>
                </div>
                <div>
                  <dt className="font-mono text-xs font-bold">{S.track.paymentStatus}</dt>
                  <dd><Badge tone={res.payment_status}>{S.paymentStatus[res.payment_status]}</Badge></dd>
                </div>
              </dl>
            </Card>
            <Card>
              <ProgressBar counted={res.campaign.counted_qty} target={res.campaign.target_qty} />
            </Card>
            <Timeline status={res.campaign.status} />
            {res.campaign.public_note && (
              <p className="border-[3px] border-ink bg-info p-3 font-bold text-info-foreground">
                {S.campaign.note}: {res.campaign.public_note}
              </p>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-bold">{k}</dt>
      <dd className="font-bold">{v}</dd>
    </div>
  );
}
