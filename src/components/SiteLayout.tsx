import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { BRAND, S } from "@/lib/strings.bn";
import { siteQuery } from "@/lib/public.functions";
import { useTheme } from "@/hooks/use-theme";
import { Ticker } from "@/components/brutal";

const NAV = [
  { to: "/", label: S.nav.home },
  { to: "/campaigns", label: S.nav.preorder },
  { to: "/track", label: S.nav.track },
  { to: "/faq", label: S.nav.faq },
  { to: "/about", label: S.nav.about },
  { to: "/contact", label: S.nav.contact },
] as const;

export function SiteLayout({ children, ticker = true }: { children: ReactNode; ticker?: boolean }) {
  const { data } = useQuery(siteQuery);
  const st = data?.settings;
  const { dark, toggle } = useTheme(!!st?.dark_default);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            {st?.logo_url ? (
              <img
                src={st.logo_url}
                alt={BRAND}
                className="size-10 shrink-0 border-[3px] border-ink bg-card object-contain p-0.5"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center border-[3px] border-ink bg-primary font-mono text-lg font-black text-primary-foreground">
                G
              </span>
            )}
            <span className="truncate font-display text-base font-extrabold uppercase sm:text-lg">{BRAND}</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="border-[3px] border-transparent px-3 py-1.5 font-bold hover:border-ink"
                activeProps={{ className: "border-ink! bg-primary text-primary-foreground" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label={dark ? S.nav.lightMode : S.nav.darkMode}
              className="brutal-press flex size-11 items-center justify-center border-[3px] border-ink bg-card shadow-[3px_3px_0_var(--ink)]"
            >
              {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={S.nav.menu}
              className="brutal-press flex size-11 items-center justify-center border-[3px] border-ink bg-primary text-primary-foreground shadow-[3px_3px_0_var(--ink)] lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="grid grid-cols-2 border-t-[3px] border-ink lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="min-h-12 border-b-2 border-r-2 border-ink px-4 py-3 font-bold"
                activeProps={{ className: "bg-primary text-primary-foreground" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      {ticker && st?.ticker && <Ticker text={st.ticker} />}
      <main className="flex-1">{children}</main>
      <footer className="border-t-[3px] border-ink bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              {st?.logo_url && (
                <img
                  src={st.logo_url}
                  alt=""
                  className="size-9 shrink-0 border-[3px] border-secondary-foreground bg-card object-contain p-0.5"
                />
              )}
              <p className="font-display text-xl font-extrabold uppercase">{BRAND}</p>
            </div>
            <p className="mt-2 text-sm opacity-80">{st?.tagline}</p>
          </div>
          <div className="flex flex-col gap-1">
            {NAV.slice(1).map((n) => (
              <Link key={n.to} to={n.to} className="font-bold hover:underline">
                {n.label}
              </Link>
            ))}
          </div>
          <div className="text-sm">
            {st?.contact_phone && <p className="font-mono">{st.contact_phone}</p>}
            {st?.contact_email && <p className="font-mono">{st.contact_email}</p>}
            {st?.contact_address && <p>{st.contact_address}</p>}
          </div>
        </div>
        <p className="border-t-2 border-secondary-foreground/30 px-4 py-3 text-center text-sm">{st?.footer}</p>
      </footer>
    </div>
  );
}
