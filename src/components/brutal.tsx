import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { S } from "@/lib/strings.bn";
import { bnNum, toBanglaDigits } from "@/lib/format";
import { CAMPAIGN_STEPS, type CampaignStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const btnVariants = cva(
  "brutal-press inline-flex min-h-11 items-center justify-center gap-2 border-[3px] border-ink px-5 py-2 font-display text-base font-bold shadow-[4px_4px_0_var(--ink)] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        dark: "bg-secondary text-secondary-foreground",
        red: "bg-accent text-accent-foreground",
        green: "bg-success text-success-foreground",
        blue: "bg-info text-info-foreground",
        outline: "bg-card text-foreground",
      },
      size: {
        md: "",
        lg: "min-h-14 px-8 text-lg",
        sm: "min-h-9 px-3 py-1 text-sm shadow-[3px_3px_0_var(--ink)]",
        icon: "min-h-8 min-w-8 p-1 shadow-[2px_2px_0_var(--ink)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const Btn = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btnVariants>
>(({ className, variant, size, type = "button", ...p }, ref) => (
  <button ref={ref} type={type} className={cn(btnVariants({ variant, size }), className)} {...p} />
));
Btn.displayName = "Btn";

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("brutal p-4 sm:p-6", className)} {...p} />;
}

export function Field({
  label,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  htmlFor?: string | undefined;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="font-mono text-xs font-bold tracking-wide">
        {label}
      </label>
      {children}
      {error && <span className="text-sm font-bold text-accent">{error}</span>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn("field", className)} {...p} />,
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} className={cn("field min-h-24", className)} {...p} />,
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...p }, ref) => <select ref={ref} className={cn("field", className)} {...p} />,
);
Select.displayName = "Select";

const badgeTone: Record<string, string> = {
  collecting: "bg-primary text-primary-foreground",
  target_reached: "bg-success text-success-foreground",
  in_production: "bg-info text-info-foreground",
  shipped: "bg-secondary text-secondary-foreground",
  delivered: "bg-success text-success-foreground",
  pending: "bg-primary text-primary-foreground",
  confirmed: "bg-info text-info-foreground",
  cancelled: "bg-accent text-accent-foreground",
  unpaid: "bg-card text-foreground",
  partial: "bg-primary text-primary-foreground",
  paid: "bg-success text-success-foreground",
  refunded: "bg-accent text-accent-foreground",
};

export function Badge({ tone, children, className }: { tone?: string; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border-2 border-ink px-2 py-0.5 text-xs font-bold leading-normal",
        badgeTone[tone ?? ""] ?? "bg-card text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ counted, target, size = "md" }: { counted: number; target: number; size?: "md" | "lg" }) {
  const pct = Math.min(100, target > 0 ? (counted / target) * 100 : 0);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-2 font-mono">
        <span className={cn("font-extrabold", size === "lg" ? "text-3xl sm:text-5xl" : "text-xl")}>
          {bnNum(counted)} / {bnNum(target)}
        </span>
        <span className={cn("border-[3px] border-ink bg-secondary px-2 font-bold text-secondary-foreground", size === "lg" ? "text-2xl" : "text-sm")}>
          {toBanglaDigits(Math.floor(pct))}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("w-full border-[3px] border-ink bg-card", size === "lg" ? "h-12" : "h-7")}
      >
        <div className="stripes h-full border-r-[3px] border-ink transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    ms,
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
  };
}

export function Countdown({ to, compact = false }: { to: string | null; compact?: boolean }) {
  const [now, setNow] = React.useState<ReturnType<typeof diff> | null>(null);
  React.useEffect(() => {
    if (!to) return;
    const t = new Date(to).getTime();
    setNow(diff(t));
    const id = setInterval(() => setNow(diff(t)), 1000);
    return () => clearInterval(id);
  }, [to]);
  if (!to) return null;
  if (now && now.ms === 0) return <Badge tone="cancelled">{S.campaign.ended}</Badge>;
  const parts: [number | undefined, string][] = [
    [now?.d, S.countdown.days],
    [now?.h, S.countdown.hours],
    [now?.m, S.countdown.minutes],
    ...(compact ? [] : ([[now?.s, S.countdown.seconds]] as [number | undefined, string][])),
  ];
  return (
    <div className="flex gap-1.5">
      {parts.map(([v, l]) => (
        <div key={l} className={cn("flex flex-col items-center border-2 border-ink bg-card", compact ? "min-w-11 px-1" : "min-w-16 px-2 py-1")}>
          <span className={cn("font-mono font-extrabold", compact ? "text-base" : "text-2xl")}>
            {v === undefined ? "--" : toBanglaDigits(String(v).padStart(2, "0"))}
          </span>
          <span className="text-[11px] font-bold">{l}</span>
        </div>
      ))}
    </div>
  );
}

export function Timeline({ status }: { status: CampaignStatus }) {
  const idx = CAMPAIGN_STEPS.indexOf(status);
  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-5">
      {CAMPAIGN_STEPS.map((st, i) => (
        <li
          key={st}
          className={cn(
            "flex items-center gap-2 border-[3px] border-ink p-2 sm:flex-col sm:text-center",
            i < idx && "bg-success text-success-foreground",
            i === idx && "bg-primary text-primary-foreground shadow-[4px_4px_0_var(--ink)]",
            i > idx && "bg-card text-muted-foreground",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center border-2 border-ink bg-card font-mono font-extrabold text-foreground">
            {toBanglaDigits(i + 1)}
          </span>
          <span className="text-sm font-bold">{S.campaignStatus[st]}</span>
        </li>
      ))}
    </ol>
  );
}

export function Ticker({ text }: { text: string }) {
  if (!text) return null;
  const items = Array.from({ length: 6 }, () => text);
  return (
    <div className="overflow-hidden border-y-[3px] border-ink bg-secondary py-2 text-secondary-foreground" aria-label={text}>
      <div className="marquee flex w-max gap-12 whitespace-nowrap font-display text-lg font-bold">
        {[...items, ...items].map((t, i) => (
          <span key={i} aria-hidden={i > 0}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse border-[3px] border-ink bg-muted", className)} />;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="border-[3px] border-dashed border-ink p-8 text-center font-bold text-muted-foreground">{children}</div>;
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("brutal max-h-[92vh] overflow-y-auto", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">{title}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function Confirm({
  open,
  onOpenChange,
  onConfirm,
  text = S.common.confirmDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  text?: string;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={S.common.delete}>
      <p className="mb-4">{text}</p>
      <div className="flex justify-end gap-2">
        <Btn variant="outline" onClick={() => onOpenChange(false)}>
          {S.common.cancel}
        </Btn>
        <Btn
          variant="red"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {S.common.delete}
        </Btn>
      </div>
    </Modal>
  );
}
