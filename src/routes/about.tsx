import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { S } from "@/lib/strings.bn";
import { siteQuery } from "@/lib/public.functions";
import { SiteLayout } from "@/components/SiteLayout";
import { Card } from "@/components/brutal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: S.meta.aboutTitle },
      { name: "description", content: S.meta.aboutDesc },
      { property: "og:title", content: S.meta.aboutTitle },
      { property: "og:description", content: S.meta.aboutDesc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteQuery),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useSuspenseQuery(siteQuery);
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-4xl">{S.about.title}</h1>
        <Card className="whitespace-pre-line text-lg">{data.settings.about}</Card>
      </div>
    </SiteLayout>
  );
}
