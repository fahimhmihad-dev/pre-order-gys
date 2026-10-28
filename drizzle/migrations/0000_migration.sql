
create type public.app_role as enum ('super_admin','admin','staff');
create type public.campaign_status as enum ('collecting','target_reached','in_production','shipped','delivered');
create type public.order_status as enum ('pending','confirmed','cancelled','in_production','shipped','delivered');
create type public.payment_status as enum ('unpaid','partial','paid','refunded');

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

-- roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.is_staff(_user_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id) $$;
create or replace function public.is_admin(_user_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('super_admin','admin')) $$;

create policy "own or staff read roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

-- first signup becomes super_admin
create or replace function public.bootstrap_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.user_roles) then
    insert into public.user_roles(user_id, role) values (new.id, 'super_admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_bootstrap after insert on auth.users
  for each row execute function public.bootstrap_first_admin();

-- campaigns
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null default '',
  images text[] not null default '{}',
  price numeric(12,2) not null default 0,
  advance_amount numeric(12,2) not null default 0,
  target_qty int not null default 100 check (target_qty > 0),
  max_per_order int not null default 5 check (max_per_order > 0),
  start_at timestamptz not null default now(),
  deadline_at timestamptz,
  est_delivery_at timestamptz,
  count_rule text not null default 'pending_confirmed' check (count_rule in ('pending_confirmed','confirmed_only')),
  waitlist_enabled boolean not null default true,
  status campaign_status not null default 'collecting',
  visibility text not null default 'draft' check (visibility in ('draft','published','archived')),
  featured boolean not null default false,
  public_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.campaigns(visibility, status);
create trigger t_campaigns_upd before update on public.campaigns for each row execute function public.touch_updated_at();
grant select on public.campaigns to anon;
grant select, insert, update, delete on public.campaigns to authenticated;
grant all on public.campaigns to service_role;
alter table public.campaigns enable row level security;
create policy "public read published" on public.campaigns for select to anon, authenticated using (visibility = 'published');
create policy "staff read all" on public.campaigns for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff insert" on public.campaigns for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update" on public.campaigns for update to authenticated using (public.is_staff(auth.uid()));
create policy "admin delete" on public.campaigns for delete to authenticated using (public.is_admin(auth.uid()));

-- orders
create sequence public.order_code_seq start 1;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null default ('GYS-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.order_code_seq')::text, 6, '0')),
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  customer_name text not null,
  phone text not null,
  alt_phone text not null default '',
  address text not null,
  area text not null default '',
  quantity int not null check (quantity > 0),
  payment_method text not null default 'cod',
  transaction_id text not null default '',
  payment_status payment_status not null default 'unpaid',
  status order_status not null default 'pending',
  note text not null default '',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders(campaign_id, status);
create index on public.orders(phone);
create index on public.orders(created_at);
create trigger t_orders_upd before update on public.orders for each row execute function public.touch_updated_at();
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "staff all orders select" on public.orders for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff insert orders" on public.orders for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update orders" on public.orders for update to authenticated using (public.is_staff(auth.uid()));
create policy "admin delete orders" on public.orders for delete to authenticated using (public.is_admin(auth.uid()));

-- waitlist
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  phone text not null,
  quantity int not null default 1 check (quantity > 0),
  converted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger t_wait_upd before update on public.waitlist for each row execute function public.touch_updated_at();
grant select, insert, update, delete on public.waitlist to authenticated;
grant all on public.waitlist to service_role;
alter table public.waitlist enable row level security;
create policy "staff waitlist" on public.waitlist for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- settings
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger t_set_upd before update on public.site_settings for each row execute function public.touch_updated_at();
grant select on public.site_settings to anon;
grant select, update, insert on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admin update settings" on public.site_settings for update to authenticated using (public.is_admin(auth.uid()));
create policy "admin insert settings" on public.site_settings for insert to authenticated with check (public.is_admin(auth.uid()));

-- faqs
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger t_faq_upd before update on public.faqs for each row execute function public.touch_updated_at();
grant select on public.faqs to anon;
grant select, insert, update, delete on public.faqs to authenticated;
grant all on public.faqs to service_role;
alter table public.faqs enable row level security;
create policy "public read faqs" on public.faqs for select to anon, authenticated using (true);
create policy "staff write faqs" on public.faqs for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "staff update faqs" on public.faqs for update to authenticated using (public.is_admin(auth.uid()));
create policy "staff delete faqs" on public.faqs for delete to authenticated using (public.is_admin(auth.uid()));

-- activity logs
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.activity_logs(created_at desc);
grant select, insert on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
alter table public.activity_logs enable row level security;
create policy "staff read logs" on public.activity_logs for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff insert logs" on public.activity_logs for insert to authenticated with check (public.is_staff(auth.uid()) and user_id = auth.uid());

-- progress
create or replace function public.campaign_counted_qty(_cid uuid) returns int
language sql stable security definer set search_path=public as $$
  select coalesce(sum(o.quantity),0)::int from public.orders o join public.campaigns c on c.id=o.campaign_id
  where o.campaign_id=_cid and (
    o.status in ('confirmed','in_production','shipped','delivered')
    or (o.status='pending' and c.count_rule='pending_confirmed'))
$$;

create or replace function public.campaign_progress()
returns table(campaign_id uuid, target_qty int, counted_qty int, remaining int, percent numeric)
language sql stable security definer set search_path=public as $$
  select c.id, c.target_qty, q.n, greatest(c.target_qty - q.n, 0), round(least(q.n::numeric / c.target_qty * 100, 100), 1)
  from public.campaigns c cross join lateral (select public.campaign_counted_qty(c.id) n) q
  where c.visibility='published' or public.is_staff(auth.uid())
$$;
grant execute on function public.campaign_progress() to anon, authenticated;

-- overbooking guard + auto status
create or replace function public.orders_guard() returns trigger language plpgsql security definer set search_path=public as $$
declare c public.campaigns; used int; counts boolean;
begin
  select * into c from public.campaigns where id = new.campaign_id for update;
  counts := new.status in ('confirmed','in_production','shipped','delivered') or (new.status='pending' and c.count_rule='pending_confirmed');
  if counts then
    select coalesce(sum(o.quantity),0) into used from public.orders o
      where o.campaign_id=c.id and o.id <> new.id and (
        o.status in ('confirmed','in_production','shipped','delivered') or (o.status='pending' and c.count_rule='pending_confirmed'));
    if used + new.quantity > c.target_qty then
      raise exception 'OVERBOOK: only % spots left', greatest(c.target_qty-used,0);
    end if;
  end if;
  return new;
end $$;
create trigger t_orders_guard before insert or update of quantity, status on public.orders for each row execute function public.orders_guard();

create or replace function public.orders_after() returns trigger language plpgsql security definer set search_path=public as $$
declare c public.campaigns;
begin
  select * into c from public.campaigns where id = new.campaign_id;
  if c.status='collecting' and public.campaign_counted_qty(c.id) >= c.target_qty then
    update public.campaigns set status='target_reached' where id=c.id;
    insert into public.activity_logs(user_id, action, entity, entity_id, details)
      values (null, 'target_reached', 'campaign', c.id::text, jsonb_build_object('title', c.title));
  end if;
  return new;
end $$;
create trigger t_orders_after after insert or update on public.orders for each row execute function public.orders_after();

-- public RPCs
create or replace function public.place_order(
  _campaign_id uuid, _name text, _phone text, _alt_phone text, _address text, _area text,
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
  if length(trim(_name)) < 2 or length(_name) > 100 then raise exception 'BAD_NAME'; end if;
  if length(trim(_address)) < 5 or length(_address) > 500 then raise exception 'BAD_ADDRESS'; end if;
  if _quantity < 1 or _quantity > c.max_per_order then raise exception 'BAD_QTY'; end if;
  if _payment_method <> 'cod' and length(trim(coalesce(_transaction_id,''))) < 4 then raise exception 'BAD_TRX'; end if;
  insert into public.orders(campaign_id, customer_name, phone, alt_phone, address, area, quantity, payment_method, transaction_id, note)
  values (c.id, trim(_name), _phone, coalesce(_alt_phone,''), trim(_address), left(coalesce(_area,''),100), _quantity, left(_payment_method,40), left(coalesce(_transaction_id,''),60), left(coalesce(_note,''),500))
  returning order_code into code;
  return code;
end $$;
grant execute on function public.place_order(uuid,text,text,text,text,text,int,text,text,text) to anon, authenticated;

create or replace function public.join_waitlist(_campaign_id uuid, _name text, _phone text, _quantity int)
returns boolean language plpgsql security definer set search_path=public as $$
declare c public.campaigns;
begin
  select * into c from public.campaigns where id=_campaign_id and visibility='published' and waitlist_enabled;
  if not found then raise exception 'NOT_FOUND'; end if;
  if _phone !~ '^01[3-9][0-9]{8}$' then raise exception 'BAD_PHONE'; end if;
  if length(trim(_name)) < 2 or length(_name) > 100 then raise exception 'BAD_NAME'; end if;
  if _quantity < 1 or _quantity > 100 then raise exception 'BAD_QTY'; end if;
  insert into public.waitlist(campaign_id, name, phone, quantity) values (c.id, trim(_name), _phone, _quantity);
  return true;
end $$;
grant execute on function public.join_waitlist(uuid,text,text,int) to anon, authenticated;

create or replace function public.track_order(_code text, _phone text)
returns json language sql stable security definer set search_path=public as $$
  select json_build_object(
    'order_code', o.order_code, 'customer_name', o.customer_name, 'quantity', o.quantity,
    'status', o.status, 'payment_status', o.payment_status, 'payment_method', o.payment_method,
    'created_at', o.created_at, 'area', o.area,
    'campaign', json_build_object('title', c.title, 'slug', c.slug, 'status', c.status, 'public_note', c.public_note,
      'target_qty', c.target_qty, 'counted_qty', public.campaign_counted_qty(c.id), 'est_delivery_at', c.est_delivery_at, 'price', c.price))
  from public.orders o join public.campaigns c on c.id=o.campaign_id
  where upper(o.order_code)=upper(trim(_code)) and o.phone=trim(_phone) limit 1
$$;
grant execute on function public.track_order(text,text) to anon, authenticated;

-- role management by email (super_admin only)
create or replace function public.admin_list_users()
returns table(user_id uuid, email text, roles app_role[], created_at timestamptz)
language sql stable security definer set search_path=public, auth as $$
  select u.id, u.email::text, coalesce(array_agg(r.role) filter (where r.role is not null), '{}'), u.created_at
  from auth.users u left join public.user_roles r on r.user_id=u.id
  where public.is_staff(auth.uid())
  group by u.id order by u.created_at
$$;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_set_role(_email text, _role app_role, _grant boolean)
returns void language plpgsql security definer set search_path=public, auth as $$
declare uid uuid;
begin
  if not public.has_role(auth.uid(),'super_admin') then raise exception 'FORBIDDEN'; end if;
  select id into uid from auth.users where lower(email)=lower(trim(_email));
  if uid is null then raise exception 'USER_NOT_FOUND'; end if;
  if _grant then
    insert into public.user_roles(user_id, role) values (uid,_role) on conflict do nothing;
  else
    if uid = auth.uid() and _role='super_admin' then raise exception 'SELF'; end if;
    delete from public.user_roles where user_id=uid and role=_role;
  end if;
  insert into public.activity_logs(user_id, action, entity, entity_id, details)
    values (auth.uid(), case when _grant then 'role_grant' else 'role_revoke' end, 'user', uid::text, jsonb_build_object('email',_email,'role',_role));
end $$;
grant execute on function public.admin_set_role(text,app_role,boolean) to authenticated;

alter publication supabase_realtime add table public.campaigns;
alter publication supabase_realtime add table public.orders;

-- seed
insert into public.site_settings(id, data) values (1, jsonb_build_object(
  'tagline', 'আগে প্রি-অর্ডার, তারপর উৎপাদন — সবাই মিলে লক্ষ্য পূরণ করি',
  'hero_text', 'আপনার পছন্দের পণ্য প্রি-অর্ডার করুন। লক্ষ্য পূরণ হলেই উৎপাদন শুরু, তারপর সরাসরি আপনার দরজায়।',
  'ticker', '🔥 সীমিত স্লট — এখনই প্রি-অর্ডার করুন ✦ সারা বাংলাদেশে ডেলিভারি ✦ ক্যাশ অন ডেলিভারি সুবিধা',
  'how_it_works', jsonb_build_array('প্রি-অর্ডার করুন — ফর্ম পূরণ করে আপনার স্লট নিশ্চিত করুন।','লক্ষ্য পূরণ — নির্ধারিত সংখ্যক অর্ডার হলেই ক্যাম্পেইন বন্ধ হয়।','উৎপাদন — আমরা আপনার পণ্য তৈরি শুরু করি।','ডেলিভারি — পণ্য সরাসরি আপনার ঠিকানায় পৌঁছে যায়।'),
  'about', 'Get Your Service - Pre Order একটি প্রি-অর্ডার প্ল্যাটফর্ম। আমরা আগে চাহিদা যাচাই করি, তারপর উৎপাদন করি — ফলে অপচয় কম, দাম ন্যায্য।',
  'contact_phone', '01700000000', 'contact_email', 'hello@example.com', 'contact_address', 'ঢাকা, বাংলাদেশ',
  'facebook', '', 'footer', '© Get Your Service - Pre Order। সর্বস্বত্ব সংরক্ষিত।',
  'dark_default', false, 'logo_url', '',
  'payment_methods', jsonb_build_array(
    jsonb_build_object('id','cod','label','ক্যাশ অন ডেলিভারি','instructions','পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।'),
    jsonb_build_object('id','bkash','label','বিকাশ','instructions','01700000000 নম্বরে Send Money করে ট্রানজেকশন আইডি দিন।'),
    jsonb_build_object('id','bank','label','ব্যাংক ট্রান্সফার','instructions','অ্যাকাউন্ট: ০০০০০০, শাখা: ঢাকা। ট্রানজেকশন আইডি দিন।'))
));

insert into public.campaigns(slug,title,description,images,price,advance_amount,target_qty,max_per_order,deadline_at,est_delivery_at,visibility,featured) values
('premium-cotton-panjabi','প্রিমিয়াম কটন পাঞ্জাবি','হাতে বাছাই করা ১০০% সুতি কাপড়ে তৈরি আরামদায়ক পাঞ্জাবি। ঈদের আগেই ডেলিভারি।', '{}', 1250, 300, 500, 5, now() + interval '20 days', now() + interval '45 days','published',true),
('leather-wallet','হ্যান্ডমেড লেদার ওয়ালেট','খাঁটি চামড়ার হাতে সেলাই করা ওয়ালেট, নাম খোদাই সুবিধাসহ।', '{}', 850, 200, 200, 3, now() + interval '10 days', now() + interval '30 days','published',false);

insert into public.faqs(question,answer,sort_order) values
('প্রি-অর্ডার কী?','পণ্য তৈরির আগেই অর্ডার দিয়ে আপনার স্লট নিশ্চিত করা। লক্ষ্য পূরণ হলে উৎপাদন শুরু হয়।',1),
('লক্ষ্য পূরণ না হলে কী হবে?','ডেডলাইনের মধ্যে লক্ষ্য পূরণ না হলে অগ্রিম টাকা সম্পূর্ণ ফেরত দেওয়া হবে।',2),
('অর্ডার কীভাবে ট্র্যাক করব?','"অর্ডার ট্র্যাক করুন" পেজে অর্ডার আইডি ও ফোন নম্বর দিন।',3);
