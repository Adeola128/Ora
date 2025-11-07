import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// --- Case Conversion Helpers ---
// These functions will automatically convert data between the app's camelCase and the DB's snake_case.

const toCamel = (s: string) => s.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
const toSnake = (s: string) => s.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const transformKeys = (obj: any, transform: (key: string) => string): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => transformKeys(v, transform));
  }
  if (typeof obj === 'object' && obj !== null) {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[transform(key)] = transformKeys(obj[key], transform);
      }
    }
    return newObj;
  }
  return obj;
};

export const toCamelCase = <T>(obj: any): T => transformKeys(obj, toCamel) as T;
export const toSnakeCase = (obj: any): any => transformKeys(obj, toSnake);


// --- Supabase Configuration ---
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


/* 
================================================================================
  SUPABASE DATABASE SETUP SCRIPT (v5 - Promo Code Logic)
  This script can be run multiple times safely.
  Execute the following SQL queries in your Supabase SQL Editor.
================================================================================
*/
/*
-- 1. UTILITY FUNCTION & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Helper function to generate short, unique, URL-friendly codes.
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  is_duplicate BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 uppercase alphanumeric characters
    new_code := UPPER(SUBSTRING(REPLACE(REPLACE(encode(gen_random_bytes(6), 'base64'), '/', '_'), '+', '-'), 1, 8));
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO is_duplicate;
    EXIT WHEN NOT is_duplicate;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

--------------------------------------------------------------------------------

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paystack_customer_code TEXT -- Stores the customer identifier from Paystack
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically update the `updated_at` column on changes.
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Function and Trigger to create a profile and trial subscription on new user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_inserted BOOLEAN := false;
  v_trial_interval TEXT := '21 days'; -- Default trial period
  v_current_date DATE := CURRENT_DATE;
  v_promo_end_date DATE := make_date(extract(year from v_current_date)::int, 11, 20); -- Nov 20th of current year
BEGIN
  -- Check for promo code 'kwasulocal' and if the current date is on or before the end date
  IF new.raw_user_meta_data->>'promo_code' = 'kwasulocal' AND v_current_date <= v_promo_end_date THEN
    v_trial_interval := '1 month';
  END IF;

  -- Loop to handle potential referral_code collisions
  FOR i IN 1..5 LOOP
    BEGIN
      INSERT INTO public.profiles (id, name, avatar_url, referral_code)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', SPLIT_PART(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        generate_referral_code()
      );
      profile_inserted := true;
      EXIT; -- Exit loop on success
    EXCEPTION
      WHEN unique_violation THEN
        IF i = 5 THEN RAISE; END IF; -- Fail on last attempt
        RAISE NOTICE 'Referral code collision, retrying... (Attempt %)', i;
    END;
  END LOOP;

  -- If profile was inserted successfully, create a trial subscription and notification settings
  IF profile_inserted THEN
    INSERT INTO public.subscriptions (id, plan, status, trial_ends_at)
    VALUES (
      new.id,
      'pro', -- Start them on a trial of the Pro plan
      'trialing',
      NOW() + v_trial_interval::interval -- Use the determined interval
    );
    -- Insert default notification settings
    INSERT INTO public.notification_settings (user_id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;


-- Drop the trigger first to ensure idempotency, then re-create it.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--------------------------------------------------------------------------------

-- 3. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own referrals." ON public.referrals;
CREATE POLICY "Users can view their own referrals." ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
-- Performance index
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals (referrer_id);

--------------------------------------------------------------------------------

-- 4. NOTIFICATION SETTINGS TABLE (NEW)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_reminders BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  new_features BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for notification_settings
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own notification settings." ON public.notification_settings;
CREATE POLICY "Users can manage their own notification settings." ON public.notification_settings FOR ALL USING (auth.uid() = user_id);

-- Trigger to automatically update the `updated_at` column on changes.
DROP TRIGGER IF EXISTS handle_updated_at ON public.notification_settings;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE PROCEDURE extensions.moddatetime (updated_at);

--------------------------------------------------------------------------------

-- 5. RPC FUNCTIONS
-- RPC to process a referral code on sign-up
CREATE OR REPLACE FUNCTION public.process_referral(
  new_user_id UUID,
  p_referral_code TEXT
)
RETURNS void AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find the referrer's ID from the code
  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NOT NULL AND v_referrer_id <> new_user_id THEN
    -- Update the new user's profile to link them to the referrer
    UPDATE public.profiles
    SET referred_by = v_referrer_id
    WHERE id = new_user_id;

    -- Create a 'completed' referral record
    INSERT INTO public.referrals (referrer_id, referred_id, referred_email, status)
    VALUES (v_referrer_id, new_user_id, (SELECT email FROM auth.users WHERE id = new_user_id), 'completed')
    ON CONFLICT (referrer_id, referred_id) DO NOTHING;
    
    -- In a real app, you might queue another job here to award points/rewards.
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC to generate a referral code if one doesn't exist for a user.
CREATE OR REPLACE FUNCTION public.ensure_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_referral_code TEXT;
  current_user_id UUID := auth.uid();
BEGIN
  -- Check for existing code
  SELECT referral_code INTO v_referral_code FROM public.profiles WHERE id = current_user_id;

  -- If no code, generate and save one
  IF v_referral_code IS NULL THEN
    v_referral_code := generate_referral_code();
    UPDATE public.profiles
    SET referral_code = v_referral_code
    WHERE id = current_user_id;
  END IF;

  RETURN v_referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- UPDATE RPC FOR INITIAL DATA FETCHING
CREATE OR REPLACE FUNCTION public.get_initial_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.id = p_user_id),
    'subscription', (SELECT to_jsonb(s) FROM public.subscriptions s WHERE s.id = p_user_id),
    'analysis_history', (SELECT COALESCE(jsonb_agg(ar.report ORDER BY ar.created_at DESC), '[]'::jsonb) FROM public.analysis_reports ar WHERE ar.user_id = p_user_id),
    'user_goals', (SELECT ug.goals FROM public.user_goals ug WHERE ug.user_id = p_user_id),
    'trackable_goals', (SELECT COALESCE(jsonb_agg(tg ORDER BY tg.created_at), '[]'::jsonb) FROM public.trackable_goals tg WHERE tg.user_id = p_user_id),
    'notification_settings', (SELECT to_jsonb(ns) FROM public.notification_settings ns WHERE ns.user_id = p_user_id)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


--------------------------------------------------------------------------------
-- Other tables from previous script (shortened for brevity)...
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  trial_ends_at TIMESTAMPTZ,
  period_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own subscription." ON public.subscriptions;
CREATE POLICY "Users can manage their own subscription." ON public.subscriptions FOR ALL USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.analysis_reports (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own reports." ON public.analysis_reports;
CREATE POLICY "Users can manage their own reports." ON public.analysis_reports FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS analysis_reports_user_id_idx ON public.analysis_reports (user_id);
*/


/**
 * A consolidated helper function to initialize and configure API clients.
 * This function reads environment variables, creates client instances for Gemini,
 * and exports their status and instances in a single, organized manner.
 */
const initializeApiClients = () => {
    // --- Gemini AI Configuration ---
    // The user can provide multiple keys in a comma-separated string for load balancing.
    const geminiApiKeys = (process.env.API_KEY || '').split(',').filter(k => k.trim());
    const isGeminiConfigured = geminiApiKeys.length > 0;
    
    // Select one key at random on initialization.
    const selectedApiKey = isGeminiConfigured 
        ? geminiApiKeys[Math.floor(Math.random() * geminiApiKeys.length)].trim()
        : 'placeholder-api-key';

    const ai = new GoogleGenAI({ apiKey: selectedApiKey });

    return {
        ai,
        isGeminiConfigured,
    };
};

// Initialize clients and export them for use throughout the application.
export const { ai, isGeminiConfigured } = initializeApiClients();
