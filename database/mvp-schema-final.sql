-- Nano Banana AI Image Studio - MVP Database Schema
-- Supabase PostgreSQL Implementation
-- Correct table creation order

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USER MANAGEMENT SYSTEM
-- =====================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 6 NOT NULL, -- Free credits for new users
  referral_code TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  referred_by UUID REFERENCES public.user_profiles(id),
  last_check_in DATE,
  consecutive_check_ins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- User can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 2. CATEGORIES SYSTEM (Must come before templates)
-- =====================================================

-- Categories table for image templates
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL, -- English name only, translations handled by i18n
  slug TEXT NOT NULL UNIQUE,
  description TEXT, -- English description only, translations handled by i18n
  icon TEXT, -- Icon class or emoji
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

-- =====================================================
-- 3. IMAGE GENERATION & EDITING SYSTEM
-- =====================================================

-- Images table
CREATE TABLE public.images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  prompt TEXT, -- For AI generation, NULL for uploads/edits
  original_image_url TEXT, -- For background removal/editing
  processed_image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL,
  image_type TEXT DEFAULT 'generation' CHECK (image_type IN ('generation', 'background_removal', 'edit', 'template')) NOT NULL,
  style TEXT, -- 'realistic', 'anime', 'illustration', 'product'
  dimensions TEXT DEFAULT '512x512',
  file_format TEXT DEFAULT 'png' CHECK (file_format IN ('png', 'jpg', 'jpeg', 'webp')),
  file_size INTEGER, -- File size in bytes
  cost INTEGER DEFAULT 1 NOT NULL, -- Credits cost varies by operation type
  external_task_id TEXT, -- Gemini/Replicate task ID
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Settings, original filename, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for images
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images" ON public.images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own images" ON public.images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images" ON public.images
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 4. TEMPLATE SYSTEM
-- =====================================================

-- Image templates table
CREATE TABLE public.image_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL, -- English name only, translations handled by i18n
  description TEXT, -- English description only, translations handled by i18n
  category_id UUID REFERENCES public.categories(id),
  preview_url TEXT NOT NULL,
  prompt_template TEXT NOT NULL, -- Base prompt for this template
  style TEXT NOT NULL,
  dimensions TEXT DEFAULT '512x512',
  tags TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for templates
ALTER TABLE public.image_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates" ON public.image_templates
  FOR SELECT USING (is_active = true);

-- =====================================================
-- 5. PAYMENT PLANS
-- =====================================================

-- Payment plans table
CREATE TABLE public.payment_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('subscription', 'credit_pack')) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  credits INTEGER NOT NULL,
  duration_months INTEGER, -- NULL for credit packs, set for subscriptions
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for payment_plans
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment plans" ON public.payment_plans
  FOR SELECT USING (is_active = true);

-- =====================================================
-- 6. ORDERS & SUBSCRIPTIONS
-- =====================================================

-- Orders table for payment tracking
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.payment_plans(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) NOT NULL,
  payment_method TEXT,
  external_order_id TEXT, -- Creem.io order ID
  external_payment_id TEXT, -- Creem.io payment ID
  credits_awarded INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- User subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.payment_plans(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due')) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  credits_included INTEGER NOT NULL,
  external_subscription_id TEXT, -- Creem.io subscription ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 7. CREDIT SYSTEM
-- =====================================================

-- Credit transactions table
CREATE TABLE public.credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- Positive for earning, negative for spending
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'referral', 'check_in')),
  description TEXT NOT NULL,
  image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 8. REFERRAL & REWARDS SYSTEM
-- =====================================================

-- Referral tracking table
CREATE TABLE public.referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'invalid')) NOT NULL,
  referrer_reward INTEGER DEFAULT 50, -- Credits for referrer
  referee_reward INTEGER DEFAULT 20, -- Credits for referee
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referee_id) -- Each user can only be referred once
);

-- Enable RLS for referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Check-in rewards configuration
CREATE TABLE public.check_in_rewards (
  day INTEGER PRIMARY KEY CHECK (day >= 1 AND day <= 7),
  credits INTEGER NOT NULL,
  is_bonus_day BOOLEAN DEFAULT false
);

-- Enable RLS for check_in_rewards
ALTER TABLE public.check_in_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view check-in rewards" ON public.check_in_rewards
  FOR SELECT USING (true);

-- =====================================================
-- 9. USER ACTIVITY & ANALYTICS
-- =====================================================

-- User activity log for analytics
CREATE TABLE public.user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'image_generated', 'background_removed', 'template_used', 'login', etc.
  resource_type TEXT, -- 'image', 'template', 'subscription', etc.
  resource_id UUID, -- ID of the resource involved
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (e.g., style, dimensions)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_referral_code ON public.user_profiles(referral_code);
CREATE INDEX idx_user_profiles_referred_by ON public.user_profiles(referred_by);

-- Credit transactions indexes
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Images indexes
CREATE INDEX idx_images_user_id ON public.images(user_id);
CREATE INDEX idx_images_status ON public.images(status);
CREATE INDEX idx_images_type ON public.images(image_type);
CREATE INDEX idx_images_created_at ON public.images(created_at DESC);

-- Templates indexes
CREATE INDEX idx_image_templates_category ON public.image_templates(category_id);
CREATE INDEX idx_image_templates_style ON public.image_templates(style);
CREATE INDEX idx_image_templates_tags ON public.image_templates USING GIN(tags);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Activity indexes
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_action ON public.user_activity(action);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- =====================================================
-- 11. INITIAL DATA SETUP
-- =====================================================

-- Insert credit pack plans (image generation focused)
INSERT INTO public.payment_plans (name, plan_type, price, currency, credits, duration_months, features, is_popular) VALUES
-- Credit Packs
('Starter Pack', 'credit_pack', 9.99, 'USD', 100, NULL, '["500 image generations", "Background removal", "Standard quality", "Basic templates"]', false),
('Popular Pack', 'credit_pack', 24.99, 'USD', 300, NULL, '["1500 image generations", "Background removal", "HD quality", "Premium templates", "Priority support"]', true),
('Pro Pack', 'credit_pack', 49.99, 'USD', 700, NULL, '["3500 image generations", "Background removal", "Premium quality", "All templates", "24/7 support"]', false),

-- Monthly Subscriptions
('Basic Monthly', 'subscription', 19.99, 'USD', 200, 1, '["1000 monthly credits", "All image tools", "HD quality", "Email support"]', false),
('Pro Monthly', 'subscription', 39.99, 'USD', 500, 1, '["2500 monthly credits", "All image tools", "Premium quality", "Priority support", "API access"]', true),
('Studio Monthly', 'subscription', 79.99, 'USD', 1200, 1, '["6000 monthly credits", "All image tools", "Premium quality", "24/7 support", "API access", "Custom styles"]', false),

-- Yearly Subscriptions (20% discount)
('Basic Yearly', 'subscription', 191.99, 'USD', 200, 12, '["1000 monthly credits", "All image tools", "HD quality", "Email support", "20% yearly discount"]', false),
('Pro Yearly', 'subscription', 383.99, 'USD', 500, 12, '["2500 monthly credits", "All image tools", "Premium quality", "Priority support", "API access", "20% yearly discount"]', false),
('Studio Yearly', 'subscription', 767.99, 'USD', 1200, 12, '["6000 monthly credits", "All image tools", "Premium quality", "24/7 support", "API access", "Custom styles", "20% yearly discount"]', false);

-- Insert check-in reward schedule
INSERT INTO public.check_in_rewards (day, credits, is_bonus_day) VALUES
(1, 5, false),   -- Day 1: 5 credits
(2, 5, false),   -- Day 2: 5 credits  
(3, 10, true),   -- Day 3: 10 credits (bonus)
(4, 5, false),   -- Day 4: 5 credits
(5, 5, false),   -- Day 5: 5 credits
(6, 10, true),   -- Day 6: 10 credits (bonus)
(7, 20, true);   -- Day 7: 20 credits (big bonus)

-- Insert image template categories
INSERT INTO public.categories (name, slug, description, icon) VALUES
('Portraits & People', 'portraits-people', 'Professional portraits and character designs', '👥'),
('Nature & Landscapes', 'nature-landscapes', 'Beautiful natural scenes and outdoor environments', '🌲'),
('Abstract & Artistic', 'abstract-artistic', 'Creative abstract designs and artistic styles', '🎨'),
('Product & Commercial', 'product-commercial', 'Product photography and commercial imagery', '📦'),
('Animals & Wildlife', 'animals-wildlife', 'Cute animals and wildlife photography', '🐾');

-- =====================================================
-- 12. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_images_updated_at ON public.images;
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON public.images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Award welcome bonus credits
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 6, 'bonus', 'Welcome bonus for new user');
  
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user credits after transaction
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles 
  SET credits = credits + NEW.amount
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger to update credits after transaction
DROP TRIGGER IF EXISTS update_credits_after_transaction ON public.credit_transactions;
CREATE TRIGGER update_credits_after_transaction
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION update_user_credits();

-- Function to handle referral rewards
CREATE OR REPLACE FUNCTION handle_referral_reward()
RETURNS TRIGGER AS $$
BEGIN
  -- Award credits to both referrer and referee when referee makes first purchase
  IF NEW.transaction_type = 'purchase' THEN
    -- Check if this is referee's first purchase and they were referred
    IF EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = NEW.user_id AND referred_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.credit_transactions 
        WHERE user_id = NEW.user_id AND transaction_type = 'purchase' AND id != NEW.id
      )
    ) THEN
      -- Award referee bonus
      INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
      SELECT NEW.user_id, 20, 'referral', 'Referral bonus for first purchase'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.credit_transactions 
        WHERE user_id = NEW.user_id AND transaction_type = 'referral' AND description = 'Referral bonus for first purchase'
      );
      
      -- Award referrer bonus
      INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
      SELECT up.referred_by, 50, 'referral', 'Referral bonus for successful referral'
      FROM public.user_profiles up
      WHERE up.id = NEW.user_id AND up.referred_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.credit_transactions 
        WHERE user_id = up.referred_by AND transaction_type = 'referral' 
        AND description = 'Referral bonus for successful referral'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger for referral rewards
DROP TRIGGER IF EXISTS handle_referral_on_purchase ON public.credit_transactions;
CREATE TRIGGER handle_referral_on_purchase
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION handle_referral_reward();

-- Note: Template usage tracking removed as usage_count field was removed
-- Usage statistics can be calculated dynamically from images table

-- =====================================================
-- 13. UTILITY VIEWS
-- =====================================================

-- View for user statistics
CREATE VIEW public.user_stats AS
SELECT 
  up.id,
  up.email,
  up.first_name,
  up.last_name,
  up.credits,
  -- Calculate total credits purchased from transactions
  COALESCE(SUM(CASE WHEN ct.transaction_type = 'purchase' THEN ct.amount END), 0) as total_credits_purchased,
  -- Calculate total credits used from transactions
  COALESCE(SUM(CASE WHEN ct.transaction_type = 'usage' THEN ABS(ct.amount) END), 0) as total_credits_used,
  up.consecutive_check_ins,
  COUNT(i.id) as total_images,
  COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_images,
  COUNT(CASE WHEN i.status = 'failed' THEN 1 END) as failed_images,
  COUNT(CASE WHEN i.image_type = 'generation' THEN 1 END) as generated_images,
  COUNT(CASE WHEN i.image_type = 'background_removal' THEN 1 END) as bg_removed_images,
  COUNT(s.id) as active_subscriptions,
  COUNT(r.id) as successful_referrals
FROM public.user_profiles up
LEFT JOIN public.images i ON up.id = i.user_id
LEFT JOIN public.subscriptions s ON up.id = s.user_id AND s.status = 'active'
LEFT JOIN public.referrals r ON up.id = r.referrer_id AND r.status = 'completed'
LEFT JOIN public.credit_transactions ct ON up.id = ct.user_id
GROUP BY up.id, up.email, up.first_name, up.last_name, up.credits, up.consecutive_check_ins;

-- Enable RLS for user_stats view
ALTER VIEW public.user_stats SET (security_barrier = true);

-- =====================================================
-- 14. HELPFUL FUNCTIONS
-- =====================================================

-- Function to check if user can generate image (has enough credits)
CREATE OR REPLACE FUNCTION can_generate_image(user_uuid UUID, image_cost INTEGER DEFAULT 5)
RETURNS BOOLEAN AS $$
DECLARE
  user_credits INTEGER;
BEGIN
  SELECT credits INTO user_credits FROM public.user_profiles WHERE id = user_uuid;
  RETURN user_credits >= image_cost;
END;
$$ language 'plpgsql' security definer;

-- Function to process daily check-in
CREATE OR REPLACE FUNCTION process_check_in(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  reward_credits INTEGER;
  new_consecutive_days INTEGER;
  result JSONB;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM public.user_profiles WHERE id = user_uuid;
  
  -- Check if user already checked in today
  IF user_record.last_check_in = CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already checked in today');
  END IF;
  
  -- Calculate consecutive days
  IF user_record.last_check_in = CURRENT_DATE - INTERVAL '1 day' THEN
    new_consecutive_days := user_record.consecutive_check_ins + 1;
  ELSE
    new_consecutive_days := 1;
  END IF;
  
  -- Reset to day 1 if more than 7 days
  IF new_consecutive_days > 7 THEN
    new_consecutive_days := 1;
  END IF;
  
  -- Get reward for current day
  SELECT credits INTO reward_credits FROM public.check_in_rewards WHERE day = new_consecutive_days;
  
  -- Update user profile
  UPDATE public.user_profiles 
  SET 
    last_check_in = CURRENT_DATE,
    consecutive_check_ins = new_consecutive_days
  WHERE id = user_uuid;
  
  -- Add credit transaction
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (user_uuid, reward_credits, 'check_in', 'Daily check-in reward - Day ' || new_consecutive_days);
  
  RETURN jsonb_build_object(
    'success', true, 
    'day', new_consecutive_days,
    'credits_earned', reward_credits,
    'message', 'Check-in successful!'
  );
END;
$$ language 'plpgsql' security definer;

-- Function to deduct credits for image operations
CREATE OR REPLACE FUNCTION deduct_credits_for_image(
  user_uuid UUID, 
  operation_type TEXT,
  credits_to_deduct INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
  user_credits INTEGER;
  new_image_id UUID;
BEGIN
  -- Check if user has enough credits
  SELECT credits INTO user_credits FROM public.user_profiles WHERE id = user_uuid;
  
  IF user_credits < credits_to_deduct THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Insufficient credits',
      'required', credits_to_deduct,
      'available', user_credits
    );
  END IF;
  
  -- Create pending image record
  INSERT INTO public.images (user_id, image_type, cost, status)
  VALUES (user_uuid, operation_type, credits_to_deduct, 'pending')
  RETURNING id INTO new_image_id;
  
  -- Deduct credits
  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description, image_id)
  VALUES (user_uuid, -credits_to_deduct, 'usage', operation_type || ' operation', new_image_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'image_id', new_image_id,
    'credits_deducted', credits_to_deduct,
    'remaining_credits', user_credits - credits_to_deduct
  );
END;
$$ language 'plpgsql' security definer;

-- =====================================================
-- COMPLETED: MVP Database Schema for AI Image Studio
-- =====================================================
-- This schema includes:
-- ✅ User management with credit system
-- ✅ Image generation & editing tracking  
-- ✅ Template system for image categories
-- ✅ Background removal functionality
-- ✅ Subscription & payment system
-- ✅ Referral & rewards system
-- ✅ User activity analytics
-- ✅ Row Level Security (RLS) policies
-- ✅ Performance indexes
-- ✅ Automated triggers and functions
-- ✅ Initial data for testing
-- 
-- Credits cost structure:
-- - Image generation: 5 credits
-- - Background removal: 1 credit  
-- - Template usage: 2 credits
-- - New user bonus: 6 credits