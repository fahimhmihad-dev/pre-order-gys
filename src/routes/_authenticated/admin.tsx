import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard, Megaphone, ShoppingCart, ListOrdered, Users, Settings, Shield, History, LogOut, Menu, ExternalLink, ChevronsLeft, Moon, Sun,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRAND, S } from "@/lib/strings.bn";
import { AdminContext } from "@/lib/admin";
import { useTheme } from "@/hooks/use-theme";
import { Btn, Card, Skeleton } from "@/components/brutal";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: S.meta.adminTitle },
      { name: "description", content: S.meta.adminTitle },
      { property: "og:title", content: S.meta.adminTitle },
      { property: "og:description", content: S.meta.adminTitle },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const N = S.admin.sidebar;
const LINKS = [
  { to: "/admin", label: N.dashboard, icon: LayoutDashboard },
  { to: "/admin/campaigns", label: N.campaigns, icon: Megaphone },
  { to: "/admin/orders", label: N.orders, icon: ShoppingCart },
  { to: "/admin/waitlist", label: N.waitlist, icon: ListOrdered },
  { to: "/admin/customers", label: N.customers, icon: Users },
  { to: "/admin/settings", label: N.settings, icon: Settings },
  { to: "/admin/users", label: N.users, icon: Shield },
  { to: "/admin/logs", label: N.logs, icon: History },
] as const;

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { dark, toggle } = useTheme(false);
  const { data: roles, isLoading } = useQuery({
    queryKey: ["my-roles", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  async function logout() {
    await supabase.auth.signOut();
    nav({ to: "/admin/login" });
  }

  if (isLoading) return <div className="p-8"><Skeleton className="h-40" /></div>;
  if (!roles?.length)
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <p className="font-bold">{S.admin.noAccess}</p>
          <p className="mt-2 font-mono text-sm">{user.email}</p>
          <Btn className="mt-4" variant="dark" onClick={logout}><LogOut /> {S.admin.logout}</Btn>
        </Card>
      </div>
    );

  const navList = (onClick?: () => void) =>
    LINKS.map((l) => (
      <Link
        key={l.to}
        to={l.to}
        onClick={onClick}
        activeOptions={{ exact: l.to === "/admin" }}
        className="flex min-h-11 items-center gap-3 border-b-2 border-ink px-4 font-bold hover:bg-sidebar-accent"
        activeProps={{ className: "bg-sidebar-primary! text-sidebar-primary-foreground" }}
        title={l.label}
      >
        <l.icon className="size-5 shrink-0" />
        {!collapsed && <span className="truncate">{l.label}</span>}
      </Link>
    ));

  return (
    <AdminContext.Provider value={{ userId: user.id, email: user.email ?? "", roles }}>
      <div className="flex min-h-screen">
        <aside className={cn("no-print sticky top-0 hidden h-screen shrink-0 flex-col border-r-[3px] border-ink bg-sidebar text-sidebar-foreground md:flex", collapsed ? "w-16" : "w-60")}>
          <div className="flex min-h-14 items-center justify-between border-b-[3px] border-ink px-3">
            {!collapsed && <span className="truncate font-display text-sm font-extrabold uppercase">{BRAND}</span>}
            <button onClick={() => setCollapsed((c) => !c)} className="flex size-9 items-center justify-center border-2 border-ink bg-card text-foreground" aria-label={S.nav.menu}>
              <ChevronsLeft className={cn("size-4", collapsed && "rotate-180")} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto">{navList()}</nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex min-h-14 items-center justify-between gap-2 border-b-[3px] border-ink bg-background px-3">
            <button className="flex size-11 items-center justify-center border-[3px] border-ink bg-primary text-primary-foreground md:hidden" onClick={() => setDrawer(true)} aria-label={S.nav.menu}>
              <Menu className="size-5" />
            </button>
            <span className="truncate font-mono text-xs font-bold sm:text-sm">{user.email}</span>
            <div className="flex items-center gap-2">
              <button onClick={toggle} className="flex size-10 items-center justify-center border-[3px] border-ink bg-card" aria-label={dark ? S.nav.lightMode : S.nav.darkMode}>
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <Link to="/" className="hidden min-h-10 items-center gap-1 border-[3px] border-ink bg-card px-3 text-sm font-bold sm:flex">
                <ExternalLink className="size-4" /> {S.admin.viewSite}
              </Link>
              <Btn size="sm" variant="dark" onClick={logout}><LogOut /> <span className="hidden sm:inline">{S.admin.logout}</span></Btn>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-3 pb-24 sm:p-6 md:pb-6">
            <Outlet />
          </main>
        </div>

        {/* mobile bottom bar */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t-[3px] border-ink bg-sidebar md:hidden">
          {LINKS.slice(0, 3).map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/admin" }} className="flex min-h-14 flex-col items-center justify-center border-r-2 border-ink text-[11px] font-bold" activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground" }}>
              <l.icon className="size-5" />
              {l.label}
            </Link>
          ))}
          <button onClick={() => setDrawer(true)} className="flex min-h-14 flex-col items-center justify-center text-[11px] font-bold">
            <Menu className="size-5" /> {S.nav.menu}
          </button>
        </nav>
        {drawer && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setDrawer(false)}>
            <div className="absolute inset-0 bg-secondary/60" />
            <div className="absolute inset-y-0 left-0 w-72 border-r-[3px] border-ink bg-sidebar text-sidebar-foreground" onClick={(e) => e.stopPropagation()}>
              <p className="border-b-[3px] border-ink p-4 font-display font-extrabold uppercase">{BRAND}</p>
              {navList(() => setDrawer(false))}
            </div>
          </div>
        )}
      </div>
    </AdminContext.Provider>
  );
}
