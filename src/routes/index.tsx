import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BRAND, S } from "@/lib/strings.bn";
import { toBanglaDigits } from "@/lib/format";
import { campaignsQuery, siteQuery } from "@/lib/public.functions";
import { SiteLayout } from "@/components/SiteLayout";
import { CampaignCard } from "@/components/CampaignCard";
import { Empty, btnVariants } from "@/components/brutal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: S.meta.homeTitle },
      { name: "description", content: S.meta.homeDesc },
      { property: "og:title", content: S.meta.homeTitle },
      { property: "og:description", content: S.meta.homeDesc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(campaignsQuery), context.queryClient.ensureQueryData(siteQuery)]),
  component: Home,
});

const STEP_TONES = ["bg-primary text-primary-foreground", "bg-success text-success-foreground", "bg-info text-info-foreground", "bg-accent text-accent-foreground"];

function Home() {
  const { data: campaigns } = useSuspenseQuery(campaignsQuery);
  const { data: site } = useSuspenseQuery(siteQuery);
  const st = site.settings;
  const active = campaigns.filter((c) => c.status === "collecting" || c.status === "target_reached");
  const done = campaigns.filter((c) => c.status !== "collecting" && c.status !== "target_reached");
  const steps = st.how_it_works?.length ? st.how_it_works : [];

  return (
    <SiteLayout>
      <section className="grid-lines border-b-[3px] border-ink">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 inline-block border-[3px] border-ink bg-accent px-3 py-1 font-mono text-sm font-bold text-accent-foreground">
              PRE-ORDER
            </p>
            <h1 className="text-4xl uppercase sm:text-6xl lg:text-7xl">{BRAND}</h1>
            <p className="mt-4 text-2xl font-bold sm:text-3xl">{st.tagline}</p>
            <p className="mt-4 max-w-xl text-lg">{st.hero_text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/campaigns" className={btnVariants({ size: "lg" })}>
                {S.home.cta} →
              </Link>
              <Link to="/track" className={btnVariants({ size: "lg", variant: "outline" })}>
                {S.home.trackCta}
              </Link>
            </div>
          </div>
          {active[0] && (
            <div className="hidden lg:block">
              <CampaignCard c={active[0]} />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-3xl sm:text-4xl">{S.home.activeTitle}</h2>
        {active.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((c) => (
              <CampaignCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <Empty>{S.home.noActive}</Empty>
        )}
      </section>

      <section className="border-y-[3px] border-ink bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-3xl sm:text-4xl">{S.home.howTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={i} className={`border-[3px] border-secondary-foreground p-5 ${STEP_TONES[i % 4]}`}>
                <span className="font-mono text-5xl font-black">{toBanglaDigits(i + 1)}</span>
                <p className="mt-3 text-lg font-bold">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-3xl sm:text-4xl">{S.home.doneTitle}</h2>
        {done.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {done.map((c) => (
              <CampaignCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <Empty>{S.home.noDone}</Empty>
        )}
      </section>
    </SiteLayout>
  );
}
