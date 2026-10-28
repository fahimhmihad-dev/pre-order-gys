alter table public.orders add column email text not null default '';
alter table public.orders alter column address set default '';
drop function if exists public.place_order(uuid,text,text,text,text,text,int,text,text,text);
create or replace function public.place_order(
  _campaign_id uuid, _name text, _phone text, _email text, _alt_phone text, _address text, _area text,
  _quantity int, _payment_method text, _transaction_id text, _note text)
returns text language plpgsql security definer set search_path=public as $$
declare c public.campaigns; code text;
begin
  select * into c from public.campaigns where id=_campaign_id and visibility='published';
  if not found then raise exception 'NOT_FOUND'; end if;
  if c.status <> 'collecting' then raise exception 'CLOSED'; end if;
  if c.deadline_at is not null and c.deadline_at < now() then raise exception 'CLOSED'; end if;
  if c.start_at > now() then raise exception 'NOT_STARTED'; end if;
  if _phone !~ '^01[3-9][0-9]{8}$' then raise exception 'BAD_PHONE'; end if;
  if coalesce(_alt_phone,'') <> '' and _alt_phone !~ '^01[3-9][0-9]{8}$' then raise exception 'BAD_PHONE'; end if;
  if coalesce(_email,'') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(_email) > 200 then raise exception 'BAD_EMAIL'; end if;
  if length(trim(_name)) < 2 or length(_name) > 100 then raise exception 'BAD_NAME'; end if;
  if _quantity < 1 or _quantity > c.max_per_order then raise exception 'BAD_QTY'; end if;
  if _payment_method <> 'cod' and length(trim(coalesce(_transaction_id,''))) < 4 then raise exception 'BAD_TRX'; end if;
  insert into public.orders(campaign_id, customer_name, phone, email, alt_phone, address, area, quantity, payment_method, transaction_id, note)
  values (c.id, trim(_name), _phone, lower(trim(_email)), coalesce(_alt_phone,''), left(coalesce(_address,''),500), left(coalesce(_area,''),100), _quantity, left(_payment_method,40), left(coalesce(_transaction_id,''),60), left(coalesce(_note,''),500))
  returning order_code into code;
  return code;
end $$;
grant execute on function public.place_order(uuid,text,text,text,text,text,text,int,text,text,text) to anon, authenticated;