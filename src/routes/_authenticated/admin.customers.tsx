import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { S } from "@/lib/strings.bn";
import { bnDate, bnNum, money, sortBn, toEnglishDigits } from "@/lib/format";
import { adminCampaignsQuery, adminOrdersQuery } from "@/lib/admin-queries";
import { AdminTable, PageHead } from "@/components/AdminTable";
import { Badge, Input, Modal } from "@/components/brutal";
import type { Order } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: CustomersAdmin });

type Cust = { phone: string; name: string; area: string; orders: Order[]; qty: number; spent: number; last: string };

function CustomersAdmin() {
  const { data: orders = [], isLoading } = useQuery(adminOrdersQuery);
  const { data: camps = [] } = useQuery(adminCampaignsQuery);
  const [q, setQ] = useState("");
  const [view, setView] = useState<Cust | null>(null);
  const price = useMemo(() => new Map(camps.map((c) => [c.id, Number(c.price)])), [camps]);
  const title = (id: string) => camps.find((c) => c.id === id)?.title ?? "—";

  const customers = useMemo(() => {
    const m = new Map<string, Cust>();
    for (const o of orders) {
      const c = m.get(o.phone) ?? { phone: o.phone, name: o.customer_name, area: o.email, orders: [], qty: 0, spent: 0, last: o.created_at };
      c.orders.push(o);
      if (o.status !== "cancelled") {
        c.qty += o.quantity;
        c.spent += o.quantity * (price.get(o.campaign_id) ?? 0);
      }
      if (o.created_at > c.last) c.last = o.created_at;
      m.set(o.phone, c);
    }
    return sortBn([...m.values()], (c) => c.name);
  }, [orders, price]);

  const s = toEnglishDigits(q).toLowerCase();
  const rows = customers.filter((c) => !s || c.phone.includes(s) || c.name.toLowerCase().includes(s));
  const C = S.admin.customers;

  return (
    <div>
      <PageHead title={S.admin.sidebar.customers}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={S.common.search} className="min-h-10 w-48" />
      </PageHead>
      <AdminTable
        loading={isLoading}
        rows={rows}
        getId={(c) => c.phone}
        cols={[
          { key: "n", label: S.admin.orders.customer, render: (c) => c.name },
          { key: "p", label: S.admin.orders.phone, render: (c) => <span className="font-mono">{c.phone}</span> },
          { key: "a", label: S.admin.orders.email, render: (c) => <span className="font-mono">{c.area}</span> },
          { key: "o", label: C.orders, render: (c) => bnNum(c.orders.length) },
          { key: "q", label: C.qty, render: (c) => bnNum(c.qty) },
          { key: "s", label: C.spent, render: (c) => money(c.spent) },
          { key: "l", label: C.last, render: (c) => bnDate(c.last) },
        ]}
        onView={setView}
      />
      {view && (
        <Modal open onOpenChange={() => setView(null)} title={`${view.name} — ${C.history}`}>
          <div className="flex flex-col gap-2">
            {view.orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-2 border-ink p-2 text-sm">
                <span className="font-mono font-bold">{o.order_code}</span>
                <span>{title(o.campaign_id)}</span>
                <span>{bnNum(o.quantity)}{S.common.pcs}</span>
                <Badge tone={o.status}>{S.orderStatus[o.status]}</Badge>
                <span>{bnDate(o.created_at)}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
