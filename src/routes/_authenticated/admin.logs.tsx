import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { S } from "@/lib/strings.bn";
import { bnDate } from "@/lib/format";
import { AdminTable, PageHead } from "@/components/AdminTable";
import type { ActivityLog } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/logs")({ component: LogsAdmin });

function LogsAdmin() {
  const L = S.admin.logs;
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "logs"],
    queryFn: async () => {
      const [{ data: logs }, { data: users }] = await Promise.all([
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.rpc("admin_list_users"),
      ]);
      const emails = new Map((users ?? []).map((u) => [u.user_id, u.email]));
      return ((logs ?? []) as ActivityLog[]).map((l) => ({ ...l, who: l.user_id ? emails.get(l.user_id) ?? "—" : L.system }));
    },
  });
  return (
    <div>
      <PageHead title={S.admin.sidebar.logs} />
      <AdminTable
        loading={isLoading}
        rows={data}
        getId={(l) => l.id}
        cols={[
          { key: "w", label: L.when, render: (l) => bnDate(l.created_at, true) },
          { key: "u", label: L.who, render: (l) => l.who },
          { key: "a", label: L.action, render: (l) => <span className="font-mono">{l.action}</span> },
          { key: "e", label: L.entity, render: (l) => l.entity },
          { key: "d", label: L.details, render: (l) => <span className="font-mono">{JSON.stringify(l.details)}</span> },
        ]}
      />
    </div>
  );
}
