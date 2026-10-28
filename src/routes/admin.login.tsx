import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BRAND, S } from "@/lib/strings.bn";
import { formKeyNav } from "@/lib/form-nav";
import { Btn, Card, Field, Input } from "@/components/brutal";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: S.meta.loginTitle },
      { name: "description", content: S.meta.loginTitle },
      { property: "og:title", content: S.meta.loginTitle },
      { property: "og:description", content: S.meta.loginTitle },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const L = S.admin.login;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      setBusy(false);
      if (error) return void toast.error(L.failed);
      nav({ to: "/admin" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setBusy(false);
      if (error) return void toast.error(S.common.error);
      if (data.session) nav({ to: "/admin" });
      else toast.success(L.checkEmail, { duration: 8000 });
    }
  }

  return (
    <div className="grid-lines flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <p className="font-display text-sm font-bold uppercase">{BRAND}</p>
        <h1 className="mb-4 text-3xl">{mode === "in" ? L.title : L.signupTitle}</h1>
        <form onSubmit={submit} onKeyDown={formKeyNav} className="flex flex-col gap-3">
          <Field label={L.email} htmlFor="l-email">
            <Input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label={L.password} htmlFor="l-pw">
            <Input id="l-pw" type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} />
          </Field>
          <Btn type="submit" size="lg" disabled={busy}>
            {busy ? S.common.loading : mode === "in" ? L.submit : L.signup}
          </Btn>
        </form>
        {mode === "up" && <p className="mt-3 text-sm text-muted-foreground">{L.firstHint}</p>}
        <button className="mt-4 font-bold underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? L.toSignup : L.toLogin}
        </button>
      </Card>
    </div>
  );
}
