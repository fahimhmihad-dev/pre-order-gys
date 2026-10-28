import { Link } from "@tanstack/react-router";
import { S } from "@/lib/strings.bn";
import { bnNum, money } from "@/lib/format";
import type { CampaignWithProgress } from "@/types";
import { Badge, Countdown, ProgressBar } from "@/components/brutal";
import { CampaignImage } from "@/components/CampaignImage";

export function CampaignCard({ c }: { c: CampaignWithProgress }) {
  const left = c.progress.remaining;
  return (
    <Link
      to="/campaign/$slug"
      params={{ slug: c.slug }}
      className="brutal brutal-press group flex flex-col"
    >
      <div className="relative aspect-[4/3] border-b-[3px] border-ink">
        <CampaignImage src={c.images[0]} title={c.title} />
        <Badge tone={c.status} className="absolute left-3 top-3">
          {S.campaignStatus[c.status]}
        </Badge>
        {left > 0 && c.status === "collecting" && (
          <span className="absolute bottom-3 right-3 border-[3px] border-ink bg-accent px-2 py-0.5 font-bold text-accent-foreground">
            🔥 {S.campaign.spotsLeft(bnNum(left))}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl">{c.title}</h3>
          <span className="shrink-0 border-[3px] border-ink bg-primary px-2 font-mono text-lg font-extrabold text-primary-foreground">
            {money(c.price)}
          </span>
        </div>
        <ProgressBar counted={c.progress.counted_qty} target={c.target_qty} />
        {c.status === "collecting" && c.deadline_at && <Countdown to={c.deadline_at} compact />}
        <span className="mt-auto font-display font-bold underline decoration-[3px] underline-offset-4">
          {S.campaign.details} →
        </span>
      </div>
    </Link>
  );
}
