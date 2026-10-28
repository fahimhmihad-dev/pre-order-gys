import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BRAND, S } from "@/lib/strings.bn";
import { campaignsQuery, siteQuery } from "@/lib/public.functions";
import { SiteLayout } from "@/components/SiteLayout";
import { CampaignCard } from "@/components/CampaignCard";
import { Empty } from "@/components/brutal";

const title = `${S.nav.preorder} — ${BRAND}`;
const desc = "সব চলমান ও সম্পন্ন প্রি-অর্ডার ক্যাম্পেইন এক জায়গায়।";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(campaignsQuery), context.queryClient.ensureQueryData(siteQuery)]),
  component: CampaignsPage,
});

function CampaignsPage() {
  const { data } = useSuspenseQuery(campaignsQuery);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="mb-8 text-4xl">{S.nav.preorder}</h1>
        {data.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => (
              <CampaignCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <Empty>{S.home.noActive}</Empty>
        )}
      </section>
    </SiteLayout>
  );
}
