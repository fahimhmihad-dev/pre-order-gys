import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Plus, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CSV_HEADERS, S } from "@/lib/strings.bn";
import { PHONE_RE, bnDate, bnNum, formatDate, money, sortBn, toEnglishDigits } from "@/lib/format";
import { formKeyNav } from "@/lib/form-nav";
import { rpcErrorText } from "@/lib/rpc-errors";
import { adminCampaignsQuery, adminOrdersQuery, adminSettingsQuery } from "@/lib/admin-queries";
import { downloadCsv, isAdminRole, logActivity, rowTint, useAdmin } from "@/lib/admin";
import { AdminTable, PageHead } from "@/components/AdminTable";
import { Badge, Btn, Field, Input, Modal, Select, Textarea } from "@/components/brutal";
import { ORDER_STATUSES, PAYMENT_STATUSES, type Order, type OrderStatus, type PaymentStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdmin,
});

const O = S.admin.orders;

function OrdersAdmin() {
  const qc = useQueryClient();
  const { roles } = useAdmin();
  const { data: orders = [], isLoading } = useQuery(adminOrdersQuery);
  const { data: camps = [] } = useQuery(adminCampaignsQuery);
  const { data: settings } = useQuery(adminSettingsQuery);
  const methods = settings?.payment_methods ?? [];
  const campMap = useMemo(() => new Map(camps.map((c) => [c.id, c])), [camps]);
  const methodLabel = (id: string) => methods.find((m) => m.id === id)?.label ?? id;

  const [fCamp, setFCamp] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPay, setFPay] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<Partial<Order> | null>(null);
  const [view, setView] = useState<Order | null>(null);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("in_production");

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const rows = orders.filter((o) => {
    if (fCamp && o.campaign_id !== fCamp) return false;
    if (fStatus && o.status !== fStatus) return false;
    if (fPay && o.payment_status !== fPay) return false;
    if (from && new Date(o.created_at) < new Date(from)) return false;
    if (to && new Date(o.created_at) > new Date(`${to}T23:59:59`)) return false;
    if (q) {
      const s = toEnglishDigits(q).toLowerCase();
      if (!o.email.includes(s) && !o.phone.includes(s) && !o.order_code.toLowerCase().includes(s) && !o.customer_name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  async function bulk(status: OrderStatus) {
    const ids = [...sel];
    if (!ids.length) return;
    const { error } = await supabase.from("orders").update({ status }).in("id", ids);
    if (error) return void toast.error(rpcErrorText(error.message));
    await logActivity("bulk_status", "order", null, { count: ids.length, status });
    toast.success(S.common.saved);
    setSel(new Set());
    refresh();
  }

  async function remove(o: Order) {
    const { error } = await supabase.from("orders").delete().eq("id", o.id);
    if (error) return void toast.error(S.common.error);
    await logActivity("delete", "order", o.id, { code: o.order_code });
    refresh();
  }

  function exportCsv() {
    const H = CSV_HEADERS;
    downloadCsv(
      `orders-${formatDate(new Date())}.csv`,
      [H.code, H.campaign, H.customer, H.phone, H.email, H.altPhone, H.qty, H.amount, H.method, H.trx, H.payment, H.status, H.note, H.date],
      rows.map((o) => [
        o.order_code,
        campMap.get(o.campaign_id)?.title ?? "",
        o.customer_name,
        o.phone,
        o.email,
        o.alt_phone,
        o.quantity,
        o.quantity * Number(campMap.get(o.campaign_id)?.price ?? 0),
        methodLabel(o.payment_method),
        o.transaction_id,
        S.paymentStatus[o.payment_status],
        S.orderStatus[o.status],
        o.note,
        formatDate(o.created_at, true),
      ]),
    );
  }

  const sortedCamps = sortBn(camps, (c) => c.title);

  return (
    <div>
      <PageHead title={S.admin.sidebar.orders}>
        <Btn size="sm" variant="outline" onClick={exportCsv} className="no-print"><Download /> {O.export}</Btn>
        <Btn size="sm" variant="outline" onClick={() => window.print()} className="no-print"><Printer /> {O.print}</Btn>
        <Btn size="sm" className="no-print" onClick={() => setEdit({ ...(camps[0] ? { campaign_id: camps[0].id } : {}), quantity: 1, payment_method: methods[0]?.id ?? "cod", status: "pending", payment_status: "unpaid" })}>
          <Plus /> {O.add}
        </Btn>
      </PageHead>

      <div className="no-print mb-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={S.common.search} className="min-h-10 text-sm" />
        <Select value={fCamp} onChange={(e) => setFCamp(e.target.value)} className="min-h-10 text-sm">
          <option value="">{O.campaign}: {S.common.all}</option>
          {sortedCamps.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </Select>
        <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="min-h-10 text-sm">
          <option value="">{O.status}: {S.common.all}</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{S.orderStatus[s]}</option>)}
        </Select>
        <Select value={fPay} onChange={(e) => setFPay(e.target.value)} className="min-h-10 text-sm">
          <option value="">{O.payment}: {S.common.all}</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{S.paymentStatus[s]}</option>)}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={O.from} className="min-h-10 text-sm" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={O.to} className="min-h-10 text-sm" />
      </div>

      {sel.size > 0 && (
        <div className="no-print mb-3 flex flex-wrap items-center gap-2 border-[3px] border-ink bg-primary p-2 text-primary-foreground">
          <span className="font-bold">{O.selected(bnNum(sel.size))}</span>
          <Btn size="sm" variant="blue" onClick={() => bulk("confirmed")}>{O.bulkConfirm}</Btn>
          <Btn size="sm" variant="red" onClick={() => bulk("cancelled")}>{O.bulkCancel}</Btn>
          <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as OrderStatus)} className="min-h-9 w-40 text-sm">
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{S.orderStatus[s]}</option>)}
          </Select>
          <Btn size="sm" variant="dark" onClick={() => bulk(bulkStatus)}>{O.bulkStatus}</Btn>
        </div>
      )}

      <AdminTable
        loading={isLoading}
        rows={rows}
        getId={(o) => o.id}
        tint={(o) => rowTint[o.status]}
        selectable
        selected={sel}
        setSelected={setSel}
        cols={[
          { key: "c", label: O.code, render: (o) => <span className="font-mono font-bold">{o.order_code}</span> },
          { key: "cm", label: O.campaign, render: (o) => campMap.get(o.campaign_id)?.title ?? "—" },
          { key: "n", label: O.customer, render: (o) => o.customer_name },
          { key: "p", label: O.phone, render: (o) => <span className="font-mono">{o.phone}</span> },
          { key: "em", label: O.email, render: (o) => <span className="font-mono">{o.email || "—"}</span> },
          { key: "q", label: O.qty, render: (o) => bnNum(o.quantity) },
          { key: "am", label: O.amount, render: (o) => money(o.quantity * Number(campMap.get(o.campaign_id)?.price ?? 0)) },
          { key: "m", label: O.method, render: (o) => methodLabel(o.payment_method) },
          { key: "t", label: O.trx, render: (o) => <span className="font-mono">{o.transaction_id || "—"}</span> },
          { key: "ps", label: O.payment, render: (o) => <Badge tone={o.payment_status}>{S.paymentStatus[o.payment_status]}</Badge> },
          { key: "s", label: O.status, render: (o) => <Badge tone={o.status}>{S.orderStatus[o.status]}</Badge> },
          { key: "d", label: O.date, render: (o) => bnDate(o.created_at, true) },
        ]}
        onView={setView}
        onEdit={setEdit}
        onDelete={isAdminRole(roles) ? remove : undefined}
      />

      {edit && (
        <OrderEditor
          initial={edit}
          camps={sortedCamps.map((c) => ({ id: c.id, title: c.title }))}
          methods={methods}
          onClose={() => setEdit(null)}
          onSaved={refresh}
        />
      )}
      {view && (
        <Modal open onOpenChange={() => setView(null)} title={O.viewTitle}>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {[
              [O.code, view.order_code],
              [O.campaign, campMap.get(view.campaign_id)?.title ?? ""],
              [O.customer, view.customer_name],
              [O.phone, `${view.phone}${view.alt_phone ? ` / ${view.alt_phone}` : ""}`],
              [O.email, view.email || "—"],
              [O.qty, bnNum(view.quantity)],
              [O.method, methodLabel(view.payment_method)],
              [O.trx, view.transaction_id || "—"],
              [O.status, S.orderStatus[view.status]],
              [O.payment, S.paymentStatus[view.payment_status]],
              [O.note, view.note || "—"],
              [O.adminNote, view.admin_note || "—"],
              [O.date, bnDate(view.created_at, true)],
            ].map(([k, v]) => (
              <div key={k} className="border-2 border-ink p-2">
                <dt className="font-mono text-[11px] font-bold">{k}</dt>
                <dd className="break-words font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </div>
  );
}

function OrderEditor({
  initial,
  camps,
  methods,
  onClose,
  onSaved,
}: {
  initial: Partial<Order>;
  camps: { id: string; title: string }[];
  methods: { id: string; label: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [o, setO] = useState<Partial<Order>>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Order>(k: K, v: Order[K]) => setO((s) => ({ ...s, [k]: v }));
  const txt = (k: "customer_name" | "email" | "address" | "area" | "note" | "admin_note") => ({
    value: (o[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value),
  });
  const dig = (k: "phone" | "alt_phone" | "transaction_id") => ({
    value: (o[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, toEnglishDigits(e.target.value)),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!o.customer_name?.trim() || !o.campaign_id) return void toast.error(S.form.required);
    if (!PHONE_RE.test(o.phone ?? "")) return void toast.error(S.form.badPhone);
    setBusy(true);
    const payload = {
      campaign_id: o.campaign_id,
      customer_name: o.customer_name.trim(),
      phone: o.phone!,
      alt_phone: o.alt_phone ?? "",
      address: o.address?.trim() ?? "",
      email: o.email?.trim().toLowerCase() ?? "",
      area: o.area ?? "",
      quantity: Number(o.quantity) || 1,
      payment_method: o.payment_method ?? "cod",
      transaction_id: o.transaction_id ?? "",
      status: (o.status ?? "pending") as OrderStatus,
      payment_status: (o.payment_status ?? "unpaid") as PaymentStatus,
      note: o.note ?? "",
      admin_note: o.admin_note ?? "",
    };
    const res = o.id
      ? await supabase.from("orders").update(payload).eq("id", o.id).select("id, order_code").single()
      : await supabase.from("orders").insert(payload).select("id, order_code").single();
    setBusy(false);
    if (res.error) return void toast.error(rpcErrorText(res.error.message));
    const changes: Record<string, unknown> = { code: res.data.order_code };
    if (initial.status && initial.status !== payload.status) changes["status"] = `${initial.status} → ${payload.status}`;
    if (initial.payment_status && initial.payment_status !== payload.payment_status) changes["payment"] = `${initial.payment_status} → ${payload.payment_status}`;
    await logActivity(o.id ? "update" : "create", "order", res.data.id, changes);
    toast.success(S.common.saved);
    onSaved();
    onClose();
  }

  return (
    <Modal open onOpenChange={onClose} title={o.id ? `${O.editTitle} · ${o.order_code}` : O.add} wide>
      <form onSubmit={save} onKeyDown={formKeyNav} className="grid grid-cols-2 gap-3">
        <Field label={O.campaign} className="col-span-2">
          <Select value={o.campaign_id ?? ""} onChange={(e) => set("campaign_id", e.target.value)}>
            {camps.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </Select>
        </Field>
        <Field label={S.form.name}><Input {...txt("customer_name")} /></Field>
        <Field label={S.form.phone}><Input {...dig("phone")} inputMode="tel" maxLength={11} /></Field>
        <Field label={S.form.altPhone}><Input {...dig("alt_phone")} inputMode="tel" maxLength={11} /></Field>
        <Field label={O.email}><Input type="email" {...txt("email")} /></Field>
        <Field label={O.qty}>
          <Input value={String(o.quantity ?? 1)} inputMode="numeric" onChange={(e) => set("quantity", Number(toEnglishDigits(e.target.value).replace(/\D/g, "")) || 0)} />
        </Field>
        <Field label={O.method}>
          <Select value={o.payment_method ?? "cod"} onChange={(e) => set("payment_method", e.target.value)}>
            {methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </Select>
        </Field>
        <Field label={O.trx}><Input {...dig("transaction_id")} /></Field>
        <Field label={O.status}>
          <Select value={o.status ?? "pending"} onChange={(e) => set("status", e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{S.orderStatus[s]}</option>)}
          </Select>
        </Field>
        <Field label={O.payment}>
          <Select value={o.payment_status ?? "unpaid"} onChange={(e) => set("payment_status", e.target.value as PaymentStatus)}>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{S.paymentStatus[s]}</option>)}
          </Select>
        </Field>
        <Field label={O.note}><Input {...txt("note")} /></Field>
        <Field label={O.adminNote} className="col-span-2"><Textarea {...txt("admin_note")} rows={2} /></Field>
        <div className="col-span-2 flex justify-end gap-2">
          <Btn variant="outline" onClick={onClose}>{S.common.cancel}</Btn>
          <Btn type="submit" variant="green" disabled={busy}>{busy ? S.common.loading : S.common.save}</Btn>
        </div>
      </form>
    </Modal>
  );
}
