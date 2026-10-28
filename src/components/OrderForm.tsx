import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { S } from "@/lib/strings.bn";
import { PHONE_RE, bnNum, money, toEnglishDigits } from "@/lib/format";
import { formKeyNav } from "@/lib/form-nav";
import { rpcErrorText } from "@/lib/rpc-errors";
import type { CampaignWithProgress, PaymentMethod } from "@/types";
import { Btn, Card, Field, Input, Select, Textarea, btnVariants } from "@/components/brutal";

type Errs = { name?: string; phone?: string; alt?: string; email?: string; trx?: string; qty?: string };

export function OrderForm({
  c,
  methods,
  onDone,
}: {
  c: CampaignWithProgress;
  methods: PaymentMethod[];
  onDone: () => void;
}) {
  const remaining = c.progress.remaining;
  const isOpen = c.status === "collecting" && remaining > 0 && (!c.deadline_at || new Date(c.deadline_at) > new Date());
  const waitlistMode = !isOpen && c.waitlist_enabled && c.status !== "delivered";
  const maxQty = Math.max(1, Math.min(c.max_per_order, waitlistMode ? 100 : remaining));

  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    alt: "",
    address: "",
    area: "",
    qty: "1",
    method: methods[0]?.id ?? "cod",
    trx: "",
    note: "",
  });
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [waitDone, setWaitDone] = useState(false);

  const set = (k: keyof typeof f, digits = false) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: digits ? toEnglishDigits(e.target.value) : e.target.value }));

  const method = methods.find((m) => m.id === f.method);
  const needsTrx = !waitlistMode && f.method !== "cod";
  const qty = Number(f.qty) || 0;

  function validate(): Errs {
    const e: Errs = {};
    if (f.name.trim().length < 2) e.name = S.form.badName;
    if (!PHONE_RE.test(f.phone)) e.phone = S.form.badPhone;
    if (!waitlistMode) {
      if (f.alt && !PHONE_RE.test(f.alt)) e.alt = S.form.badPhone;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = S.form.badEmail;
      if (needsTrx && f.trx.trim().length < 4) e.trx = S.form.badTrx;
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > maxQty) e.qty = S.form.badQty(bnNum(maxQty));
    if (!waitlistMode && qty > remaining) e.qty = S.form.overQty(bnNum(remaining));
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    if (waitlistMode) {
      const { error } = await supabase.rpc("join_waitlist", {
        _campaign_id: c.id,
        _name: f.name,
        _phone: f.phone,
        _quantity: qty,
      });
      setBusy(false);
      if (error) return void toast.error(rpcErrorText(error.message));
      setWaitDone(true);
      toast.success(S.success.waitlistDone);
      return;
    }
    const { data, error } = await supabase.rpc("place_order", {
      _campaign_id: c.id,
      _name: f.name,
      _phone: f.phone,
      _email: f.email,
      _alt_phone: f.alt,
      _address: f.address,
      _area: f.area,
      _quantity: qty,
      _payment_method: f.method,
      _transaction_id: needsTrx ? f.trx : "",
      _note: f.note,
    });
    setBusy(false);
    if (error) return void toast.error(rpcErrorText(error.message));
    setCode(data as string);
    onDone();
  }

  if (code) {
    return (
      <Card className="bg-success text-success-foreground">
        <h2 className="text-3xl">✓ {S.success.title}</h2>
        <p className="mt-2">{S.success.body}</p>
        <p className="mt-4 font-mono text-xs font-bold">{S.success.orderId}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="border-[3px] border-ink bg-card px-3 py-2 font-mono text-2xl font-extrabold text-foreground">{code}</span>
          <Btn
            variant="dark"
            onClick={() => {
              navigator.clipboard.writeText(code);
              toast.success(S.success.copied);
            }}
          >
            <Copy /> {S.success.copy}
          </Btn>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/track" search={{ code, phone: f.phone }} className={btnVariants({ variant: "outline" })}>
            {S.success.track}
          </Link>
          <Btn variant="primary" onClick={() => setCode(null)}>
            {S.success.another}
          </Btn>
        </div>
      </Card>
    );
  }

  if (waitDone) return <Card className="bg-info text-info-foreground text-lg font-bold">✓ {S.success.waitlistDone}</Card>;

  if (!isOpen && !waitlistMode) return <Card className="text-lg font-bold">{S.form.closed}</Card>;

  return (
    <Card>
      <h2 className="text-2xl sm:text-3xl">{waitlistMode ? S.form.waitlistTitle : S.form.title}</h2>
      {waitlistMode && <p className="mt-1 font-bold text-accent">{S.form.waitlistInfo}</p>}
      <p className="mt-1 hidden font-mono text-xs text-muted-foreground sm:block">{S.form.keyboardHint}</p>
      <form onSubmit={submit} onKeyDown={formKeyNav} noValidate className="mt-4 grid grid-cols-2 gap-3">
        <Field label={S.form.name} error={errs.name} className="col-span-2" htmlFor="of-name">
          <Input id="of-name" value={f.name} onChange={set("name")} placeholder={S.form.namePh} autoComplete="name" maxLength={100} />
        </Field>
        <Field label={S.form.phone} error={errs.phone} htmlFor="of-phone">
          <Input id="of-phone" value={f.phone} onChange={set("phone", true)} placeholder={S.form.phonePh} inputMode="tel" maxLength={11} />
        </Field>
        {!waitlistMode ? (
          <Field label={S.form.altPhone} error={errs.alt} htmlFor="of-alt">
            <Input id="of-alt" value={f.alt} onChange={set("alt", true)} placeholder={S.form.altPhonePh} inputMode="tel" maxLength={11} />
          </Field>
        ) : (
          <Field label={S.form.quantity} error={errs.qty} htmlFor="of-qty">
            <Input id="of-qty" value={f.qty} onChange={set("qty", true)} inputMode="numeric" />
          </Field>
        )}
        {!waitlistMode && (
          <>
            <Field label={S.form.email} error={errs.email} className="col-span-2" htmlFor="of-email">
              <Input id="of-email" type="email" value={f.email} onChange={set("email")} placeholder={S.form.emailPh} autoComplete="email" maxLength={200} />
            </Field>
            <Field label={`${S.form.quantity} (≤ ${bnNum(maxQty)})`} error={errs.qty} htmlFor="of-qty" className="col-span-2">
              <Input id="of-qty" value={f.qty} onChange={set("qty", true)} inputMode="numeric" />
            </Field>
            <Field label={S.form.paymentMethod} className={needsTrx ? "" : "col-span-2"} htmlFor="of-method">
              <Select id="of-method" value={f.method} onChange={set("method")}>
                {methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            {needsTrx && (
              <Field label={S.form.trx} error={errs.trx} htmlFor="of-trx">
                <Input id="of-trx" value={f.trx} onChange={set("trx", true)} placeholder={S.form.trxPh} maxLength={60} />
              </Field>
            )}
            {method?.instructions && (
              <p className="col-span-2 border-[3px] border-dashed border-ink bg-muted p-2 text-sm">{method.instructions}</p>
            )}
            <Field label={S.form.note} className="col-span-2" htmlFor="of-note">
              <Textarea id="of-note" value={f.note} onChange={set("note")} placeholder={S.form.notePh} maxLength={500} rows={2} />
            </Field>
            <div className="col-span-2 flex items-center justify-between border-[3px] border-ink bg-primary p-3 text-primary-foreground">
              <span className="font-bold">{S.form.total}</span>
              <span className="font-mono text-2xl font-extrabold">{money(Number(c.price) * (qty || 0))}</span>
            </div>
          </>
        )}
        <Btn type="submit" size="lg" variant={waitlistMode ? "blue" : "red"} disabled={busy} className="col-span-2">
          {busy ? S.form.submitting : waitlistMode ? S.form.submitWaitlist : S.form.submit}
        </Btn>
      </form>
    </Card>
  );
}
