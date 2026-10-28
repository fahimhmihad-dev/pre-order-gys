import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { S } from "@/lib/strings.bn";
import { formKeyNav } from "@/lib/form-nav";
import { adminSettingsQuery } from "@/lib/admin-queries";
import { isAdminRole, logActivity, uploadImage, useAdmin } from "@/lib/admin";
import { PageHead } from "@/components/AdminTable";
import { Btn, Card, Confirm, Field, Input, Skeleton, Textarea } from "@/components/brutal";
import type { Json } from "@/integrations/supabase/types";
import type { Faq, SiteSettings } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsAdmin });

const T = S.admin.settings;

function SettingsAdmin() {
  const qc = useQueryClient();
  const { roles } = useAdmin();
  const { data } = useQuery(adminSettingsQuery);
  const [s, setS] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setS({ ...data, how_it_works: data.how_it_works ?? ["", "", "", ""], payment_methods: data.payment_methods ?? [] });
  }, [data]);
  if (!s) return <Skeleton className="h-96" />;
  const canEdit = isAdminRole(roles);
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS({ ...s, [k]: v });
  const txt = (k: keyof SiteSettings) => ({ value: String(s[k] ?? ""), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("site_settings").update({ data: s as unknown as Json }).eq("id", 1);
    setBusy(false);
    if (error) return void toast.error(S.common.error);
    await logActivity("update", "settings", "1");
    toast.success(S.common.saved);
    qc.invalidateQueries();
  }

  return (
    <div>
      <PageHead title={S.admin.sidebar.settings} />
      <form onSubmit={save} onKeyDown={formKeyNav} className="flex flex-col gap-4">
        <fieldset disabled={!canEdit} className="flex flex-col gap-4">
          <Card className="grid grid-cols-2 gap-3">
            <h2 className="col-span-2 text-xl">{T.general}</h2>
            <Field label={T.logo} className="col-span-2">
              <div className="flex items-center gap-3">
                {s.logo_url && <img src={s.logo_url} alt="" className="size-14 border-[3px] border-ink object-cover" />}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try { set("logo_url", await uploadImage(f, "brand")); } catch { toast.error(S.common.error); }
                  }}
                />
                {s.logo_url && <Btn size="sm" variant="outline" onClick={() => set("logo_url", "")}>{S.common.delete}</Btn>}
              </div>
            </Field>
            <Field label={T.tagline} className="col-span-2"><Input {...txt("tagline")} /></Field>
            <Field label={T.hero} className="col-span-2"><Textarea {...txt("hero_text")} rows={2} /></Field>
            <Field label={T.ticker} className="col-span-2"><Input {...txt("ticker")} /></Field>
            <Field label={T.phone}><Input {...txt("contact_phone")} /></Field>
            <Field label={T.email}><Input {...txt("contact_email")} /></Field>
            <Field label={T.address}><Input {...txt("contact_address")} /></Field>
            <Field label={T.facebook}><Input {...txt("facebook")} /></Field>
            <Field label={T.footer} className="col-span-2"><Input {...txt("footer")} /></Field>
            <label className="col-span-2 flex min-h-11 items-center gap-2 font-bold">
              <input type="checkbox" className="size-5" checked={!!s.dark_default} onChange={(e) => set("dark_default", e.target.checked)} /> {T.darkDefault}
            </label>
          </Card>
          <Card className="grid grid-cols-2 gap-3">
            <h2 className="col-span-2 text-xl">{T.content}</h2>
            {s.how_it_works.map((h, i) => (
              <Field key={i} label={`${T.how} — ${i + 1}`}>
                <Textarea value={h} rows={2} onChange={(e) => set("how_it_works", s.how_it_works.map((x, j) => (j === i ? e.target.value : x)))} />
              </Field>
            ))}
            <Field label={T.about} className="col-span-2"><Textarea {...txt("about")} rows={5} /></Field>
          </Card>
          <Card className="flex flex-col gap-3">
            <h2 className="text-xl">{T.payments}</h2>
            {s.payment_methods.map((m, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 border-2 border-ink p-2 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
                <Field label={T.methodId}><Input value={m.id} onChange={(e) => set("payment_methods", s.payment_methods.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)))} className="font-mono" /></Field>
                <Field label={T.methodLabel}><Input value={m.label} onChange={(e) => set("payment_methods", s.payment_methods.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></Field>
                <Field label={T.methodInstr} className="col-span-2 sm:col-span-1"><Input value={m.instructions} onChange={(e) => set("payment_methods", s.payment_methods.map((x, j) => (j === i ? { ...x, instructions: e.target.value } : x)))} /></Field>
                <Btn size="icon" variant="red" onClick={() => set("payment_methods", s.payment_methods.filter((_, j) => j !== i))} aria-label={S.common.delete}><Trash2 /></Btn>
              </div>
            ))}
            <Btn size="sm" variant="outline" className="self-start" onClick={() => set("payment_methods", [...s.payment_methods, { id: "", label: "", instructions: "" }])}>
              <Plus /> {T.addMethod}
            </Btn>
          </Card>
          <Btn type="submit" size="lg" variant="green" disabled={busy}>{busy ? S.common.loading : S.common.save}</Btn>
        </fieldset>
      </form>
      <FaqEditor canEdit={canEdit} />
    </div>
  );
}

function FaqEditor({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: async () => ((await supabase.from("faqs").select("*").order("sort_order")).data ?? []) as Faq[],
  });
  const [rows, setRows] = useState<Faq[]>([]);
  const [del, setDel] = useState<Faq | null>(null);
  useEffect(() => setRows(data), [data]);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin", "faqs"] }); qc.invalidateQueries({ queryKey: ["site"] }); };

  async function saveRow(f: Faq) {
    const { error } = await supabase.from("faqs").update({ question: f.question, answer: f.answer }).eq("id", f.id);
    if (error) return void toast.error(S.common.error);
    toast.success(S.common.saved);
    refresh();
  }
  async function move(i: number, d: -1 | 1) {
    const a = rows[i], b = rows[i + d];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("faqs").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("faqs").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    refresh();
  }
  async function add() {
    const max = Math.max(0, ...rows.map((r) => r.sort_order));
    await supabase.from("faqs").insert({ question: T.question, answer: T.answer, sort_order: max + 1 });
    refresh();
  }

  return (
    <Card className="mt-6 flex flex-col gap-3">
      <h2 className="text-xl">{T.faqs}</h2>
      {rows.map((f, i) => (
        <div key={f.id} className="flex flex-col gap-2 border-2 border-ink p-2">
          <Input value={f.question} disabled={!canEdit} aria-label={T.question} onChange={(e) => setRows(rows.map((r) => (r.id === f.id ? { ...r, question: e.target.value } : r)))} />
          <Textarea value={f.answer} disabled={!canEdit} aria-label={T.answer} rows={2} onChange={(e) => setRows(rows.map((r) => (r.id === f.id ? { ...r, answer: e.target.value } : r)))} />
          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" variant="green" onClick={() => saveRow(f)}>{S.common.save}</Btn>
              <Btn size="sm" variant="outline" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp /> {T.up}</Btn>
              <Btn size="sm" variant="outline" onClick={() => move(i, 1)} disabled={i === rows.length - 1}><ArrowDown /> {T.down}</Btn>
              <Btn size="sm" variant="red" onClick={() => setDel(f)}><Trash2 /> {S.common.delete}</Btn>
            </div>
          )}
        </div>
      ))}
      {canEdit && <Btn size="sm" variant="outline" className="self-start" onClick={add}><Plus /> {T.addFaq}</Btn>}
      <Confirm
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          await supabase.from("faqs").delete().eq("id", del.id);
          await logActivity("delete", "faq", del.id);
          refresh();
        }}
      />
    </Card>
  );
}
