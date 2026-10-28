import { cn } from "@/lib/utils";

export function CampaignImage({ src, title, className }: { src?: string; title: string; className?: string }) {
  if (src) return <img src={src} alt={title} loading="lazy" className={cn("h-full w-full object-cover", className)} />;
  return (
    <div className={cn("grid-lines flex h-full w-full items-center justify-center bg-primary p-6", className)}>
      <span className="text-center font-display text-3xl font-extrabold text-primary-foreground">{title}</span>
    </div>
  );
}
