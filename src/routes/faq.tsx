import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { S } from "@/lib/strings.bn";
import { toBanglaDigits } from "@/lib/format";
import { siteQuery } from "@/lib/public.functions";
import { SiteLayout } from "@/components/SiteLayout";
import { Empty } from "@/components/brutal";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: S.meta.faqTitle },
      { name: "description", content: S.meta.faqDesc },
      { property: "og:title", content: S.meta.faqTitle },
      { property: "og:description", content: S.meta.faqDesc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteQuery),
  component: FaqPage,
});

function FaqPage() {
  const { data } = useSuspenseQuery(siteQuery);
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-4xl">{S.faq.title}</h1>
        {data.faqs.length ? (
          <div className="flex flex-col gap-4">
            {data.faqs.map((f, i) => (
              <details key={f.id} className="brutal group p-0" open={i === 0}>
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 p-4 font-display text-lg font-bold">
                  <span className="flex size-9 shrink-0 items-center justify-center border-[3px] border-ink bg-primary font-mono text-primary-foreground">
                    {toBanglaDigits(i + 1)}
                  </span>
                  {f.question}
                </summary>
                <p className="whitespace-pre-line border-t-[3px] border-ink p-4">{f.answer}</p>
              </details>
            ))}
          </div>
        ) : (
          <Empty>{S.faq.empty}</Empty>
        )}
      </div>
    </SiteLayout>
  );
}
