

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
const supabaseUrl = 'https://edouqwauhyuzxrharbpv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb3Vxd2F1aHl1enhyaGFyYnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTY2NzEsImV4cCI6MjA3NzA5MjY3MX0.gCqPmHuRs325RJvjlHoKq6CliysLhyFsvD669_e-JtM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


/* 
================================================================================
  SUPABASE DATABASE SETUP SCRIPT (v3 - Referrals Update)
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
$$ LANGUAGE plpgsql;

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
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
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

-- Function and Trigger to create a profile on new user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, referral_code)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', generate_referral_code());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- 4. RPC FUNCTION to process a referral code on sign-up
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Add other tables like user_goals, trackable_goals, etc. here if they are not already present.

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
    'trackable_goals', (SELECT COALESCE(jsonb_agg(tg ORDER BY tg.created_at), '[]'::jsonb) FROM public.trackable_goals tg WHERE tg.user_id = p_user_id)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

*/


/**
 * A consolidated helper function to initialize and configure API clients.
 * This function reads environment variables, creates client instances for Gemini,
 * and exports their status and instances in a single, organized manner.
 */
const initializeApiClients = () => {
    // --- Gemini AI Configuration ---
    const geminiApiKey = process.env.API_KEY;
    
    // Correctly determine if Gemini is configured by checking for the API key.
    const isGeminiConfigured = !!geminiApiKey;
    
    // Initialize Gemini AI client. If the key is missing, the isGeminiConfigured
    // flag will prevent the app from making API calls, showing a setup message instead.
    const ai = new GoogleGenAI({ apiKey: geminiApiKey || 'placeholder-api-key' });

    return {
        ai,
        isGeminiConfigured,
    };
};

// Initialize clients and export them for use throughout the application.
export const { ai, isGeminiConfigured } = initializeApiClients();