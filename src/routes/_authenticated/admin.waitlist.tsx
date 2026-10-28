import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { S } from "@/lib/strings.bn";
import { bnDate, bnNum } from "@/lib/format";
import { rpcErrorText } from "@/lib/rpc-errors";
import { adminCampaignsQuery } from "@/lib/admin-queries";
import { logActivity } from "@/lib/admin";
import { AdminTable, PageHead } from "@/components/AdminTable";
import { Badge, Btn } from "@/components/brutal";
import type { WaitlistEntry } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/waitlist")({ component: WaitlistAdmin });

function WaitlistAdmin() {
  const qc = useQueryClient();
  const { data: camps = [] } = useQuery(adminCampaignsQuery);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "waitlist"],
    queryFn: async () => {
      const { data } = await supabase.from("waitlist").select("*").order("created_at", { ascending: false });
      return (data ?? []) as WaitlistEntry[];
    },
  });
  const title = (id: string) => camps.find((c) => c.id === id)?.title ?? "—";

  async function convert(w: WaitlistEntry) {
    const { data: o, error } = await supabase
      .from("orders")
      .insert({ campaign_id: w.campaign_id, customer_name: w.name, phone: w.phone, quantity: w.quantity, admin_note: S.admin.waitlist.fromWaitlist })
      .select("id, order_code")
      .single();
    if (error) return void toast.error(rpcErrorText(error.message));
    await supabase.from("waitlist").update({ converted: true }).eq("id", w.id);
    await logActivity("convert", "waitlist", w.id, { code: o.order_code });
    toast.success(`${S.common.saved}: ${o.order_code}`);
    qc.invalidateQueries({ queryKey: ["admin"] });
  }
  async function remove(w: WaitlistEntry) {
    await supabase.from("waitlist").delete().eq("id", w.id);
    await logActivity("delete", "waitlist", w.id, { name: w.name });
    qc.invalidateQueries({ queryKey: ["admin", "waitlist"] });
  }

  return (
    <div>
      <PageHead title={S.admin.sidebar.waitlist} />
      <AdminTable
        loading={isLoading}
        rows={data}
        getId={(w) => w.id}
        tint={(w) => (w.converted ? "bg-tint-delivered" : undefined)}
        cols={[
          { key: "c", label: S.admin.orders.campaign, render: (w) => title(w.campaign_id) },
          { key: "n", label: S.admin.orders.customer, render: (w) => w.name },
          { key: "p", label: S.admin.orders.phone, render: (w) => <span className="font-mono">{w.phone}</span> },
          { key: "q", label: S.admin.orders.qty, render: (w) => bnNum(w.quantity) },
          { key: "d", label: S.admin.orders.date, render: (w) => bnDate(w.created_at, true) },
          { key: "s", label: S.admin.orders.status, render: (w) => (w.converted ? <Badge tone="delivered">{S.admin.waitlist.converted}</Badge> : "—") },
        ]}
        onDelete={remove}
        extra={(w) =>
          !w.converted && (
            <Btn size="icon" variant="blue" onClick={() => convert(w)} title={S.admin.waitlist.convert} aria-label={S.admin.waitlist.convert}>
              <ArrowRightLeft />
            </Btn>
          )
        }
      />
    </div>
  );
}
