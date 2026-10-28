import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Plus, Archive, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { S } from "@/lib/strings.bn";
import { bnDate, bnNum, money, slugify, sortBn, toEnglishDigits, toLocalInput } from "@/lib/format";
import { formKeyNav } from "@/lib/form-nav";
import { adminCampaignsQuery } from "@/lib/admin-queries";
import { isAdminRole, logActivity, rowTint, uploadImage, useAdmin } from "@/lib/admin";
import { AdminTable, PageHead } from "@/components/AdminTable";
import { Badge, Btn, Field, Input, Modal, Select, Textarea } from "@/components/brutal";
import { CAMPAIGN_STEPS, type Campaign, type CampaignStatus, type CampaignWithProgress } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/campaigns")({
  component: CampaignsAdmin,
});

const C = S.admin.campaigns;
type Draft = Omit<Campaign, "id" | "created_at" | "updated_at"> & { id?: string };

const blank = (): Draft => ({
  slug: "",
  title: "",
  description: "",
  images: [],
  price: 0,
  advance_amount: 0,
  target_qty: 100,
  max_per_order: 5,
  start_at: new Date().toISOString(),
  deadline_at: new Date(Date.now() + 14 * 86400000).toISOString(),
  est_delivery_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  count_rule: "pending_confirmed",
  waitlist_enabled: true,
  status: "collecting",
  visibility: "draft",
  featured: false,
  public_note: "",
});

function CampaignsAdmin() {
  const qc = useQueryClient();
  const { roles } = useAdmin();
  const { data = [], isLoading } = useQuery(adminCampaignsQuery);
  const [edit, setEdit] = useState<Draft | null>(null);
  const [view, setView] = useState<CampaignWithProgress | null>(null);
  const [q, setQ] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const rows = sortBn(
    data.filter((c) => !q || c.title.includes(q) || c.slug.includes(q.toLowerCase())),
    (c) => c.title,
  );

  async function remove(c: CampaignWithProgress) {
    const { error } = await supabase.from("campaigns").delete().eq("id", c.id);
    if (error) return void toast.error(S.common.error);
    await logActivity("delete", "campaign", c.id, { title: c.title });
    toast.success(S.common.saved);
    refresh();
  }

  async function archive(c: CampaignWithProgress) {
    await supabase.from("campaigns").update({ visibility: "archived" }).eq("id", c.id);
    await logActivity("archive", "campaign", c.id, { title: c.title });
    refresh();
  }

  function duplicate(c: CampaignWithProgress) {
    const { id: _i, created_at: _c, updated_at: _u, progress: _p, ...rest } = c;
    setEdit({ ...rest, title: c.title + C.copySuffix, slug: `${c.slug}-copy`, visibility: "draft", status: "collecting" });
  }

  return (
    <div>
      <PageHead title={S.admin.sidebar.campaigns}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={S.common.search} className="min-h-10 w-48" />
        <Btn size="sm" onClick={() => setEdit(blank())}><Plus /> {C.new}</Btn>
      </PageHead>
      <AdminTable
        loading={isLoading}
        rows={rows}
        getId={(c) => c.id}
        tint={(c) => rowTint[c.status]}
        cols={[
          { key: "t", label: C.title, render: (c) => <span className="font-bold">{c.title}</span> },
          { key: "s", label: C.status, render: (c) => <Badge tone={c.status}>{S.campaignStatus[c.status]}</Badge> },
          { key: "v", label: C.visibility, render: (c) => S.visibility[c.visibility as keyof typeof S.visibility] },
          { key: "p", label: C.progress, render: (c) => `${bnNum(c.progress.counted_qty)} / ${bnNum(c.target_qty)}` },
          { key: "pr", label: C.price, render: (c) => money(c.price) },
          { key: "d", label: C.deadline, render: (c) => bnDate(c.deadline_at) },
          { key: "f", label: C.featured, render: (c) => (c.featured ? "★" : "") },
        ]}
        onView={setView}
        onEdit={(c) => {
          const { progress: _p, ...rest } = c;
          setEdit(rest);
        }}
        onDelete={isAdminRole(roles) ? remove : undefined}
        extra={(c) => (
          <>
            <Btn size="icon" variant="outline" onClick={() => duplicate(c)} title={C.duplicate} aria-label={C.duplicate}><Copy /></Btn>
            <Btn size="icon" variant="outline" onClick={() => archive(c)} title={C.archive} aria-label={C.archive}><Archive /></Btn>
          </>
        )}
      />
      {edit && <CampaignEditor draft={edit} onClose={() => setEdit(null)} onSaved={refresh} />}
      {view && (
        <Modal open onOpenChange={() => setView(null)} title={view.title}>
          <div className="flex flex-col gap-2 text-sm">
            <p className="whitespace-pre-line">{view.description}</p>
            <p>{C.price}: {money(view.price)} · {C.advance}: {money(view.advance_amount)}</p>
            <p>{C.progress}: {bnNum(view.progress.counted_qty)} / {bnNum(view.target_qty)}</p>
            <p>{C.countRule}: {S.countRule[view.count_rule as keyof typeof S.countRule]}</p>
            <p>{C.start}: {bnDate(view.start_at)} · {C.deadline}: {bnDate(view.deadline_at)}</p>
            <a className="font-bold underline" href={`/campaign/${view.slug}`} target="_blank" rel="noreferrer">/campaign/{view.slug}</a>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CampaignEditor({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(draft);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));
  const num = (k: "price" | "advance_amount" | "target_qty" | "max_per_order") => ({
    value: String(d[k]),
    inputMode: "numeric" as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(toEnglishDigits(e.target.value).replace(/[^0-9.]/g, "")) || 0),
  });
  const date = (k: "start_at" | "deadline_at" | "est_delivery_at") => ({
    type: "datetime-local",
    value: toLocalInput(d[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value ? new Date(e.target.value).toISOString() : null as never),
  });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUp(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => uploadImage(f, "campaigns")));
      set("images", [...d.images, ...urls]);
    } catch {
      toast.error(S.common.error);
    }
    setUp(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) return void toast.error(S.form.required);
    setBusy(true);
    const { id, ...payload } = { ...d, slug: d.slug.trim() || slugify(d.title) };
    const prev = draft.status;
    const res = id
      ? await supabase.from("campaigns").update(payload).eq("id", id).select("id").single()
      : await supabase.from("campaigns").insert(payload).select("id").single();
    setBusy(false);
    if (res.error) return void toast.error(res.error.message.includes("duplicate") ? `${C.slug}: ${S.common.error}` : S.common.error);
    await logActivity(id ? "update" : "create", "campaign", res.data.id, {
      title: d.title,
      ...(id && prev !== d.status ? { status: `${prev} → ${d.status}` } : {}),
    });
    toast.success(S.common.saved);
    onSaved();
    onClose();
  }

  return (
    <Modal open onOpenChange={onClose} title={draft.id ? C.editTitle : C.new} wide>
      <form onSubmit={save} onKeyDown={formKeyNav} className="grid grid-cols-2 gap-3">
        <Field label={C.title} className="col-span-2">
          <Input value={d.title} onChange={(e) => setD((s) => ({ ...s, title: e.target.value, slug: draft.id ? s.slug : slugify(e.target.value) }))} />
        </Field>
        <Field label={C.slug} className="col-span-2">
          <Input value={d.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="font-mono" />
        </Field>
        <Field label={C.description} className="col-span-2">
          <Textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={4} />
        </Field>
        <Field label={C.price}><Input {...num("price")} /></Field>
        <Field label={C.advance}><Input {...num("advance_amount")} /></Field>
        <Field label={C.target}><Input {...num("target_qty")} /></Field>
        <Field label={C.maxPerOrder}><Input {...num("max_per_order")} /></Field>
        <Field label={C.start}><Input {...date("start_at")} /></Field>
        <Field label={C.deadline}><Input {...date("deadline_at")} /></Field>
        <Field label={C.estDelivery}><Input {...date("est_delivery_at")} /></Field>
        <Field label={C.countRule}>
          <Select value={d.count_rule} onChange={(e) => set("count_rule", e.target.value)}>
            {Object.entries(S.countRule).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label={C.status}>
          <Select value={d.status} onChange={(e) => set("status", e.target.value as CampaignStatus)}>
            {CAMPAIGN_STEPS.map((s) => <option key={s} value={s}>{S.campaignStatus[s]}</option>)}
          </Select>
        </Field>
        <Field label={C.visibility}>
          <Select value={d.visibility} onChange={(e) => set("visibility", e.target.value)}>
            {Object.entries(S.visibility).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label={C.publicNote} className="col-span-2">
          <Input value={d.public_note} onChange={(e) => set("public_note", e.target.value)} />
        </Field>
        <label className="flex min-h-11 items-center gap-2 font-bold">
          <input type="checkbox" className="size-5" checked={d.waitlist_enabled} onChange={(e) => set("waitlist_enabled", e.target.checked)} /> {C.waitlist}
        </label>
        <label className="flex min-h-11 items-center gap-2 font-bold">
          <input type="checkbox" className="size-5" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} /> {C.featured}
        </label>
        <div className="col-span-2">
          <p className="mb-1 font-mono text-xs font-bold">{C.images}</p>
          <div className="flex flex-wrap gap-2">
            {d.images.map((src) => (
              <div key={src} className="relative size-20 border-[3px] border-ink">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => set("images", d.images.filter((x) => x !== src))} className="absolute -right-2 -top-2 border-2 border-ink bg-accent p-0.5 text-accent-foreground" aria-label={S.common.delete}>
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <label className="flex size-20 cursor-pointer items-center justify-center border-[3px] border-dashed border-ink text-center text-[11px] font-bold">
              {up ? S.common.loading : C.upload}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>
        </div>
        <div className="col-span-2 flex justify-end gap-2">
          <Btn variant="outline" onClick={onClose}>{S.common.cancel}</Btn>
          <Btn type="submit" variant="green" disabled={busy || up}>{busy ? S.common.loading : S.common.save}</Btn>
        </div>
      </form>
    </Modal>
  );
}
