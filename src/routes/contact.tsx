import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Facebook, Mail, MapPin, Phone } from "lucide-react";
import { S } from "@/lib/strings.bn";
import { siteQuery } from "@/lib/public.functions";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: S.meta.contactTitle },
      { name: "description", content: S.meta.contactDesc },
      { property: "og:title", content: S.meta.contactTitle },
      { property: "og:description", content: S.meta.contactDesc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteQuery),
  component: ContactPage,
});

function ContactPage() {
  const st = useSuspenseQuery(siteQuery).data.settings;
  const items = [
    { icon: Phone, k: S.contact.phone, v: st.contact_phone, href: `tel:${st.contact_phone}`, tone: "bg-primary text-primary-foreground" },
    { icon: Mail, k: S.contact.email, v: st.contact_email, href: `mailto:${st.contact_email}`, tone: "bg-info text-info-foreground" },
    { icon: MapPin, k: S.contact.address, v: st.contact_address, tone: "bg-success text-success-foreground" },
    { icon: Facebook, k: S.contact.social, v: st.facebook, href: st.facebook, tone: "bg-accent text-accent-foreground" },
  ].filter((i) => i.v);
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-4xl">{S.contact.title}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ icon: Icon, k, v, href, tone }) => {
            const body = (
              <>
                <Icon className="size-8" />
                <p className="mt-2 font-mono text-xs font-bold">{k}</p>
                <p className="break-words text-xl font-bold">{v}</p>
              </>
            );
            return href ? (
              <a key={k} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`brutal brutal-press p-6 ${tone}`}>
                {body}
              </a>
            ) : (
              <div key={k} className={`brutal p-6 ${tone}`}>
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
}
