-- Payments table for Cashfree integration
create table if not exists public.payments (
  id text primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount decimal not null,
  currency text not null default 'INR',
  status text not null default 'pending', -- pending, completed, failed, refunded
  payment_method text,
  payment_time timestamptz,
  cashfree_order_id text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies for payments
alter table public.payments enable row level security;

-- Users can view their own payments
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Users can insert their own payments
create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- Admins can view all payments
create policy "Admins can view all payments"
  on public.payments for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
  );

-- Admins can update all payments
create policy "Admins can update all payments"
  on public.payments for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
  );

-- Index for faster lookups
create index if not exists idx_payments_booking_id on public.payments(booking_id);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);
