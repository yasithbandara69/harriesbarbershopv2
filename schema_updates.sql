-- Create a new table for user subscriptions
create table public.user_subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  square_subscription_id text not null,
  plan_id text not null, 
  status text not null, -- 'ACTIVE', 'CANCELED', 'PAST_DUE'
  credits int not null default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_pkey primary key (id),
  constraint user_subscriptions_user_id_key unique (user_id)
);

-- Enable RLS
alter table public.user_subscriptions enable row level security;

-- Create policies
create policy "Users can view their own subscription" on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

create policy "Service role can manage all subscriptions" on public.user_subscriptions
  for all
  using (true)
  with check (true);
