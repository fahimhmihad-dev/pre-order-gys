create or replace function public.orders_after() returns trigger language plpgsql security definer set search_path=public as $$
declare c public.campaigns;
begin
  select * into c from public.campaigns where id = new.campaign_id;
  if c.status='collecting' and public.campaign_counted_qty(c.id) >= c.target_qty then
    update public.campaigns set status='target_reached' where id=c.id;
    insert into public.activity_logs(user_id, action, entity, entity_id, details)
      values (null, 'target_reached', 'campaign', c.id::text, jsonb_build_object('title', c.title));
  else
    -- ping so realtime subscribers on campaigns refresh progress
    update public.campaigns set updated_at = now() where id=c.id;
  end if;
  return new;
end $$;