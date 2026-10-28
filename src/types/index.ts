import type { Database } from "@/integrations/supabase/types";

export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type WaitlistEntry = Database["public"]["Tables"]["waitlist"]["Row"];
export type Faq = Database["public"]["Tables"]["faqs"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_logs"]["Row"];
export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export type Progress = { campaign_id: string; target_qty: number; counted_qty: number; remaining: number; percent: number };
export type CampaignWithProgress = Campaign & { progress: Progress };

export type PaymentMethod = { id: string; label: string; instructions: string };
export type SiteSettings = {
  tagline: string;
  hero_text: string;
  ticker: string;
  how_it_works: string[];
  about: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  facebook: string;
  footer: string;
  dark_default: boolean;
  logo_url: string;
  payment_methods: PaymentMethod[];
};

export const CAMPAIGN_STEPS: CampaignStatus[] = ["collecting", "target_reached", "in_production", "shipped", "delivered"];
export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "cancelled", "in_production", "shipped", "delivered"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "partial", "paid", "refunded"];
