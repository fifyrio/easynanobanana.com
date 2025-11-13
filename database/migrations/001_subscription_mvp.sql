-- Subscription MVP Migration
-- Adds minimal fields needed for subscription management
-- Run this migration after the initial database setup

-- Add subscription management fields to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS renewal_reminder_sent boolean DEFAULT false;

-- Add plan tracking to user_profiles for quick access
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS active_plan_id uuid REFERENCES public.payment_plans(id),
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone;

-- Create indexes for fast subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON public.subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal
ON public.subscriptions(current_period_end)
WHERE status = 'active' AND cancel_at_period_end = false;

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription
ON public.user_profiles(active_plan_id)
WHERE active_plan_id IS NOT NULL;

-- Add subscription tracking to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id),
ADD COLUMN IF NOT EXISTS is_renewal boolean DEFAULT false;

-- Seed payment_plans table with monthly subscription plans
-- Note: Only inserts if plans don't exist (checks by name and plan_type)
DO $$
BEGIN
  -- Insert Basic Monthly if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.payment_plans WHERE name = 'Basic Monthly' AND plan_type = 'subscription') THEN
    INSERT INTO public.payment_plans (name, plan_type, price, currency, credits, duration_months, is_popular, is_active, features)
    VALUES (
      'Basic Monthly',
      'subscription',
      7.99,
      'USD',
      100,
      1,
      false,
      true,
      '["50 high-quality images/month", "All style templates included", "Standard generation speed", "Basic customer support", "JPG/PNG format downloads"]'::jsonb
    );
  END IF;

  -- Insert Pro Monthly if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.payment_plans WHERE name = 'Pro Monthly' AND plan_type = 'subscription') THEN
    INSERT INTO public.payment_plans (name, plan_type, price, currency, credits, duration_months, is_popular, is_active, features)
    VALUES (
      'Pro Monthly',
      'subscription',
      27.99,
      'USD',
      500,
      1,
      true,
      true,
      '["250 high-quality images/month", "All style templates included", "Priority generation queue", "Priority customer support", "JPG/PNG/WebP format downloads", "Batch generation feature"]'::jsonb
    );
  END IF;

  -- Insert Max Monthly if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.payment_plans WHERE name = 'Max Monthly' AND plan_type = 'subscription') THEN
    INSERT INTO public.payment_plans (name, plan_type, price, currency, credits, duration_months, is_popular, is_active, features)
    VALUES (
      'Max Monthly',
      'subscription',
      78.99,
      'USD',
      1600,
      1,
      false,
      true,
      '["800 high-quality images/month", "All style templates included", "Fastest generation speed", "Dedicated account manager", "All format downloads", "Batch generation feature"]'::jsonb
    );
  END IF;
END $$;

-- Add comment explaining the schema
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'If true, subscription will not renew and will expire at current_period_end';
COMMENT ON COLUMN public.subscriptions.renewal_reminder_sent IS 'Tracks if renewal reminder email has been sent';
COMMENT ON COLUMN public.user_profiles.active_plan_id IS 'Quick reference to current active subscription plan';
COMMENT ON COLUMN public.user_profiles.subscription_expires_at IS 'Denormalized expiration date for fast queries';
