import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { S } from "@/lib/strings.bn";
import { bnDate } from "@/lib/format";
import { rpcErrorText } from "@/lib/rpc-errors";
import { useAdmin } from "@/lib/admin";
import { AdminTable, PageHead } from "@/components/AdminTable";
import { Badge, Btn, Card, Field, Input, Select } from "@/components/brutal";
import type { AppRole } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: UsersAdmin });

const ROLES: AppRole[] = ["super_admin", "admin", "staff"];

function UsersAdmin() {
  const U = S.admin.users;
  const qc = useQueryClient();
  const { roles } = useAdmin();
  const isSuper = roles.includes("super_admin");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("staff");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => (await supabase.rpc("admin_list_users")).data ?? [],
  });

  async function setR(e: string, r: AppRole, grant: boolean) {
    const { error } = await supabase.rpc("admin_set_role", { _email: e, _role: r, _grant: grant });
    if (error) return void toast.error(rpcErrorText(error.message));
    toast.success(S.common.saved);
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  return (
    <div>
      <PageHead title={S.admin.sidebar.users} />
      <Card className="mb-4">
        <p className="mb-3 text-sm">{isSuper ? U.hint : U.onlySuper}</p>
        {isSuper && (
          <form
            className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setR(email, role, true);
            }}
          >
            <Field label={U.email} className="col-span-2 sm:col-span-1">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={U.roles}>
              <Select value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
                {ROLES.map((r) => <option key={r} value={r}>{U.role[r]}</option>)}
              </Select>
            </Field>
            <Btn type="submit" variant="green">{U.grant}</Btn>
          </form>
        )}
      </Card>
      <AdminTable
        loading={isLoading}
        rows={data}
        getId={(u) => u.user_id}
        cols={[
          { key: "e", label: U.email, render: (u) => <span className="font-mono">{u.email}</span> },
          {
            key: "r",
            label: U.roles,
            render: (u) => (
              <div className="flex flex-wrap justify-center gap-1">
                {u.roles.map((r) => (
                  <Badge key={r} tone={r === "super_admin" ? "cancelled" : r === "admin" ? "confirmed" : "pending"}>
                    {U.role[r]}
                    {isSuper && (
                      <button className="ml-1 font-black" onClick={() => setR(u.email, r, false)} aria-label={U.revoke} title={U.revoke}>×</button>
                    )}
                  </Badge>
                ))}
                {!u.roles.length && "—"}
              </div>
            ),
          },
          { key: "j", label: U.joined, render: (u) => bnDate(u.created_at) },
        ]}
      />
    </div>
  );
}
