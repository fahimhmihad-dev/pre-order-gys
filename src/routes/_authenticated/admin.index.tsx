import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { S } from "@/lib/strings.bn";
import { bnNum, money, toBanglaDigits } from "@/lib/format";
import { adminCampaignsQuery, adminOrdersQuery } from "@/lib/admin-queries";
import { Card, ProgressBar, Skeleton } from "@/components/brutal";
import { PageHead } from "@/components/AdminTable";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const D = S.admin.dash;
  const { data: camps, isLoading: l1 } = useQuery(adminCampaignsQuery);
  const { data: orders, isLoading: l2 } = useQuery(adminOrdersQuery);
  if (l1 || l2 || !camps || !orders) return <Skeleton className="h-96" />;

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const valid = orders.filter((o) => o.status !== "cancelled");
  const priceOf = new Map(camps.map((c) => [c.id, Number(c.price)]));
  const stats = [
    { k: D.active, v: bnNum(camps.filter((c) => c.status === "collecting" && c.visibility === "published").length), tone: "bg-primary text-primary-foreground" },
    { k: D.today, v: bnNum(valid.filter((o) => new Date(o.created_at).getTime() >= dayStart).length), tone: "bg-card" },
    { k: D.month, v: bnNum(valid.filter((o) => new Date(o.created_at).getTime() >= monthStart).length), tone: "bg-card" },
    { k: D.pendingPay, v: bnNum(orders.filter((o) => o.status === "pending" && o.payment_method !== "cod").length), tone: "bg-accent text-accent-foreground" },
    {
      k: D.revenue,
      v: money(valid.filter((o) => o.status !== "pending").reduce((s, o) => s + o.quantity * (priceOf.get(o.campaign_id) ?? 0), 0)),
      tone: "bg-success text-success-foreground",
    },
    { k: D.reached, v: bnNum(camps.filter((c) => c.status !== "collecting").length), tone: "bg-info text-info-foreground" },
  ];

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(dayStart - (29 - i) * 86400000);
    const next = d.getTime() + 86400000;
    return { d, n: valid.filter((o) => { const t = new Date(o.created_at).getTime(); return t >= d.getTime() && t < next; }).length };
  });
  const max = Math.max(1, ...days.map((x) => x.n));
  const closest = camps
    .filter((c) => c.status === "collecting")
    .sort((a, b) => b.progress.counted_qty / b.target_qty - a.progress.counted_qty / a.target_qty)
    .slice(0, 5);

  return (
    <div>
      <PageHead title={S.admin.sidebar.dashboard} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div key={s.k} className={`brutal-sm p-3 ${s.tone}`}>
            <p className="text-xs font-bold">{s.k}</p>
            <p className="font-mono text-2xl font-extrabold">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="mb-3 text-xl">{D.chart}</h2>
          <div className="flex h-48 items-end gap-[3px] border-b-[3px] border-l-[3px] border-ink p-1">
            {days.map((x, i) => (
              <div key={i} className="group relative flex-1" title={`${toBanglaDigits(x.d.getDate())}: ${toBanglaDigits(x.n)}`}>
                <div className="border-2 border-ink bg-primary" style={{ height: `${(x.n / max) * 170}px`, minHeight: x.n ? 4 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[11px]">
            <span>{toBanglaDigits(`${days[0].d.getDate()}/${days[0].d.getMonth() + 1}`)}</span>
            <span>{toBanglaDigits(`${days[29].d.getDate()}/${days[29].d.getMonth() + 1}`)}</span>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 text-xl">{D.closest}</h2>
          <div className="flex flex-col gap-4">
            {closest.map((c) => (
              <Link key={c.id} to="/admin/campaigns" className="block">
                <p className="mb-1 truncate font-bold">{c.title}</p>
                <ProgressBar counted={c.progress.counted_qty} target={c.target_qty} />
              </Link>
            ))}
            {!closest.length && <p className="text-muted-foreground">{S.common.empty}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
