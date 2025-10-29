

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
  SUPABASE DATABASE SETUP SCRIPT (v2 - Improved & Idempotent)
  This script can be run multiple times safely.
  Execute the following SQL queries in your Supabase SQL Editor.
================================================================================
*/
/*
-- 1. UTILITY FUNCTION & EXTENSIONS
-- Enable the `moddatetime` extension to automatically update `updated_at` columns.
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- 2. PROFILES TABLE
-- Stores public user data linked to the authentication system.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger first to ensure idempotency, then re-create it.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--------------------------------------------------------------------------------

-- 3. SUBSCRIPTIONS TABLE
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

--------------------------------------------------------------------------------

-- 4. ANALYSIS REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.analysis_reports (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own reports." ON public.analysis_reports;
CREATE POLICY "Users can manage their own reports." ON public.analysis_reports FOR ALL USING (auth.uid() = user_id);
-- Performance index
CREATE INDEX IF NOT EXISTS analysis_reports_user_id_idx ON public.analysis_reports (user_id);

--------------------------------------------------------------------------------

-- 5. USER GOALS TABLE
CREATE TABLE IF NOT EXISTS public.user_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goals JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own goals." ON public.user_goals;
CREATE POLICY "Users can manage their own goals." ON public.user_goals FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.user_goals;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW
  EXECUTE PROCEDURE extensions.moddatetime (updated_at);
  
--------------------------------------------------------------------------------

-- 6. TRACKABLE GOALS TABLE
CREATE TABLE IF NOT EXISTS public.trackable_goals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  unit TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  tracking_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'auto'
  metric TEXT, -- e.g., 'overallScore', 'pacing', 'fluency'
  condition TEXT, -- 'above' or 'below'
  metric_target NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.trackable_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own trackable goals." ON public.trackable_goals;
CREATE POLICY "Users can manage their own trackable goals." ON public.trackable_goals FOR ALL USING (auth.uid() = user_id);
-- Performance index
CREATE INDEX IF NOT EXISTS trackable_goals_user_id_idx ON public.trackable_goals (user_id);

--------------------------------------------------------------------------------

-- 7. AVATARS STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']) ON CONFLICT (id) DO UPDATE 
  SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );
DROP POLICY IF EXISTS "Authenticated users can upload an avatar." ON storage.objects;
CREATE POLICY "Authenticated users can upload an avatar." ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' AND auth.uid() = owner);
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
CREATE POLICY "Users can update their own avatar." ON storage.objects FOR UPDATE USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'avatars' );

--------------------------------------------------------------------------------

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  provider TEXT DEFAULT 'paystack',
  provider_reference TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payments." ON public.payments;
CREATE POLICY "Users can view their own payments." ON public.payments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own payments." ON public.payments;
CREATE POLICY "Users can insert their own payments." ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Performance index
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);

--------------------------------------------------------------------------------

-- 9. RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  icon TEXT NOT NULL,
  content JSONB NOT NULL
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Resources are public and viewable by everyone." ON public.resources;
CREATE POLICY "Resources are public and viewable by everyone." ON public.resources FOR SELECT USING (true);

--------------------------------------------------------------------------------
-- 10. EMAIL JOBS & TRIGGERS (For Asynchronous Emailing)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_jobs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email_type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY; -- Keep it locked down
-- Performance index
CREATE INDEX IF NOT EXISTS email_jobs_user_id_idx ON public.email_jobs (user_id);
CREATE INDEX IF NOT EXISTS email_jobs_processed_at_idx ON public.email_jobs (processed_at);

-- Trigger to queue a "welcome" email.
CREATE OR REPLACE FUNCTION public.queue_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_jobs (email_type, user_id)
  VALUES ('welcome', new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_profile_created_queue_email ON public.profiles;
CREATE TRIGGER on_new_profile_created_queue_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.queue_welcome_email();

--------------------------------------------------------------------------------
-- 11. INITIAL DATA SEEDING
--------------------------------------------------------------------------------
-- Note: Using `ON CONFLICT (id) DO NOTHING` makes these inserts idempotent.

-- POPULATE RESOURCES TABLE
-- Category: Mastering Delivery
INSERT INTO public.resources (id, category, title, subtitle, icon, content) VALUES
('pacing', 'Mastering Delivery', 'How to Control Your Pacing', 'Finding the perfect rhythm for your speech.', 'speed', '[{"type": "paragraph", "text": "Your speaking pace, or words per minute (WPM), is a critical element of effective communication. Speak too fast, and your audience won''t be able to keep up. Speak too slow, and you risk boring them. The key is to find a natural, conversational pace that you can vary for emphasis."}, {"type": "heading", "text": "Finding Your Baseline"}, {"type": "paragraph", "text": "The ideal speaking pace for most presentations is between 140-160 WPM. To find your own pace, try recording yourself speaking for one minute on a familiar topic. Then, paste the transcript into a word counter. This gives you your baseline WPM."}, {"type": "heading", "text": "The Power of the Pause"}, {"type": "paragraph", "text": "Pauses are not signs of weakness; they are powerful tools. A well-timed pause can:"}, {"type": "list", "items": ["Add emphasis to a key point.", "Give your audience time to process information.", "Create suspense and anticipation.", "Allow you to gather your thoughts."]}, {"type": "tip", "text": "Try pausing for 2-3 seconds before and after you share a critical piece of information. It acts like a verbal highlighter."}, {"type": "heading", "text": "Practice Exercise: The Metronome"}, {"type": "paragraph", "text": "Find a simple text passage and a metronome app. Set the metronome to 150 BPM (beats per minute) and try to speak one word per beat. This exercise can feel unnatural at first, but it''s a great way to internalize the ideal rhythm of a conversational speaking pace."}]'),
('vocal-variety', 'Mastering Delivery', 'Vocal Variety Exercises', 'Making your voice more engaging and dynamic.', 'graphic_eq', '[{"type": "paragraph", "text": "Vocal variety is the spice of public speaking. It''s how you use your voice''s pitch, volume, and tone to keep your audience engaged and convey emotion. A monotonous voice is a surefire way to lose your audience''s attention."}, {"type": "heading", "text": "The Three Pillars of Vocal Variety"}, {"type": "list", "items": ["Pitch: The highness or lowness of your voice. Vary your pitch to avoid sounding robotic.", "Volume: How loudly or softly you speak. Use volume to emphasize key words or create intimacy.", "Tone: The emotional quality of your voice. Your tone should match your message (e.g., excited, serious, empathetic)."]}, {"type": "heading", "text": "Exercise 1: The Emotional Sentence"}, {"type": "paragraph", "text": "Take a simple, neutral sentence like, ''I''m going to the store.'' Now, say it aloud in the following ways:"}, {"type": "list", "items": ["Excitedly, as if you won the lottery.", "Angrily, as if you were forced to go.", "Sadly, as if it''s the last time you''ll see it.", "Questioningly, as if you''re not sure."]}, {"type": "paragraph", "text": "This helps you connect emotion to your voice."}, {"type": "heading", "text": "Exercise 2: The Pitch Rollercoaster"}, {"type": "paragraph", "text": "Read a passage from a book, but intentionally exaggerate the pitch changes. Make your voice go high on exciting words and low on serious ones. While it sounds silly, it stretches your vocal range and makes you more aware of pitch."}, {"type": "tip", "text": "Record yourself doing these exercises. Listening back is the fastest way to identify areas where your voice becomes flat or monotonous."}]'),
('body-language', 'Mastering Delivery', 'Using Body Language Effectively', 'What you''re saying without speaking a word.', 'accessibility_new', '[{"type": "paragraph", "text": "Your body language can either reinforce or contradict your message. Confident, open posture and purposeful gestures make you appear more credible and engaging."}, {"type": "heading", "text": "Posture and Stance"}, {"type": "paragraph", "text": "Stand with your feet shoulder-width apart, with your weight balanced evenly. Keep your shoulders back and your chest open. This ''power pose'' not only looks confident but can also make you feel more confident."}, {"type": "heading", "text": "Gestures: The Strike Zone"}, {"type": "paragraph", "text": "The most effective gestures happen in the ''strike zone''—the area from your shoulders to your hips. Keep your hands open and use them to illustrate your points. Avoid pointing, crossing your arms, or keeping your hands in your pockets."}, {"type": "list", "items": ["Use open-palm gestures to show honesty and inclusivity.", "Use your fingers to enumerate points (one, two, three).", "Use the space around you to represent ideas or timelines."]}, {"type": "heading", "text": "Eye Contact"}, {"type": "paragraph", "text": "Eye contact builds trust and connection with your audience. Don''t just stare at one person or sweep your gaze across the room. Instead, try the ''Z-pattern'' or ''W-pattern,'' making eye contact with individuals in different parts of the room for 3-5 seconds each."}, {"type": "tip", "text": "Practice in front of a mirror or record yourself. Pay attention to what your hands are doing when you''re not actively gesturing. Are they relaxed at your sides, or are you fidgeting?"}]')
ON CONFLICT (id) DO NOTHING;

-- Category: Content & Storytelling
INSERT INTO public.resources (id, category, title, subtitle, icon, content) VALUES
('opening', 'Content & Storytelling', 'The Art of the Opening', 'Grabbing your audience''s attention from the very first word.', 'rocket_launch', '[{"type": "paragraph", "text": "You have about 30 seconds to capture your audience''s attention. A weak opening means you''ll spend the rest of your speech trying to win them back. A strong opening makes them eager to hear what''s next."}, {"type": "heading", "text": "Powerful Opening Techniques"}, {"type": "list", "items": ["Ask a Rhetorical Question: ''What if you could double your productivity in just one week?''", "Start with a Surprising Statistic: ''Did you know that over 90% of communication is non-verbal?''", "Tell a Short, Relevant Story: ''Last Tuesday, I had a conversation that completely changed how I think about leadership...''", "Make a Bold Statement: ''Everything you know about marketing is wrong.''", "Use a Powerful Quote: ''As Einstein once said, ''''The definition of insanity is doing the same thing over and over again and expecting different results.''''"]}, {"type": "heading", "text": "What to Avoid in Your Opening"}, {"type": "list", "items": ["Apologizing: Never start with ''Sorry, I''m a bit nervous.''", "A Long, Boring Introduction: ''Hi, my name is John Smith, and I''m here today to talk to you about the history of...'' Get to the hook first!", "Technical Jargon: Don''t alienate your audience from the start with terms they don''t understand."]}, {"type": "tip", "text": "Your opening and closing are the two most memorable parts of your speech. Write them out word-for-word and practice them until they are second nature."}]'),
('persuasion', 'Content & Storytelling', 'Structuring a Persuasive Speech', 'Guiding your audience to a new perspective or action.', 'campaign', '[{"type": "paragraph", "text": "A persuasive speech isn''t just about presenting facts; it''s about taking your audience on a psychological journey. One of the most effective structures for this is Monroe''s Motivated Sequence, a five-step process designed to move people to action."}, {"type": "heading", "text": "Monroe''s Motivated Sequence"}, {"type": "list", "items": ["1. Attention: Grab the audience''s attention with a compelling story, statistic, or question. Make them want to listen.", "2. Need: Convince the audience there is a problem that needs to be solved. Use evidence and examples to show how this problem directly affects them.", "3. Satisfaction: Present your solution. Explain how your idea or product solves the problem you just established. This is where you lay out the details of your plan.", "4. Visualization: Paint a picture of the future. Describe what the world will look like if your solution is implemented (the positive future) and what it will look like if it''s not (the negative future). Make it vivid and emotional.", "5. Action: Tell the audience exactly what you want them to do. This should be a clear, simple, and direct call to action. ''Sign the petition,'' ''Try our demo today,'' or ''Vote for this policy.''"]}, {"type": "tip", "text": "The Visualization step is often the most powerful. Use storytelling and sensory details to help your audience emotionally connect with the outcome you''re proposing."}]'),
('narrative', 'Content & Storytelling', 'Crafting a Compelling Narrative', 'Using stories to make your message memorable.', 'edit_note', '[{"type": "paragraph", "text": "Facts and figures are forgettable. Stories are sticky. A well-crafted narrative can transform a dry presentation into a memorable and emotionally resonant experience for your audience."}, {"type": "heading", "text": "The Basic Story Arc"}, {"type": "paragraph", "text": "Even a short anecdote in a speech should have a simple structure:"}, {"type": "list", "items": ["The Setup: Introduce the characters and the initial situation. Who are we talking about, and what was their world like?", "The Conflict: Describe the problem or challenge that arose. This is the heart of the story.", "The Resolution: Explain how the challenge was overcome and what was learned. This is where you connect the story back to your main message."]}, {"type": "heading", "text": "Making it Personal"}, {"type": "paragraph", "text": "The most powerful stories are often personal ones. Sharing a relevant personal struggle and how you overcame it builds vulnerability and trust with your audience. It shows that you''re not just an expert, but a human being they can relate to."}, {"type": "tip", "text": "Always have a point. A story without a clear link to your message is just an entertaining diversion. After your story, explicitly state the takeaway: ''The reason I share that story is because it illustrates the importance of...''"}]')
ON CONFLICT (id) DO NOTHING;

-- Category: Confidence Building
INSERT INTO public.resources (id, category, title, subtitle, icon, content) VALUES
('stage-fright', 'Confidence Building', 'Overcoming Stage Fright', 'Turning nervous energy into confident performance.', 'healing', '[{"type": "paragraph", "text": "That feeling of a racing heart, sweaty palms, and a shaky voice before a speech is completely normal. It''s your body''s ''fight or flight'' response. The trick isn''t to eliminate it, but to manage it and reframe it as excitement."}, {"type": "heading", "text": "Technique 1: Box Breathing"}, {"type": "paragraph", "text": "This simple technique can calm your nervous system in minutes."}, {"type": "list", "items": ["Inhale slowly through your nose for a count of 4.", "Hold your breath for a count of 4.", "Exhale slowly through your mouth for a count of 4.", "Hold your breath for a count of 4.", "Repeat for 2-3 minutes before you go on stage."]}, {"type": "heading", "text": "Technique 2: Reframe Your Anxiety"}, {"type": "paragraph", "text": "The physical symptoms of anxiety and excitement are remarkably similar. Instead of telling yourself, ''I''m so nervous,'' try telling yourself, ''I''m so excited to share my message!'' This mental shift can transform how you experience the physical sensations."}, {"type": "heading", "text": "Technique 3: Preparation is Key"}, {"type": "paragraph", "text": "The biggest antidote to fear is competence. The more you practice and know your material, the less you''ll have to be nervous about. Don''t just practice what you''ll say, practice how you''ll say it."}, {"type": "tip", "text": "Focus on the first 30 seconds. If you can deliver your opening confidently, you''ll build momentum and your nerves will naturally start to settle."}]'),
('power-posing', 'Confidence Building', 'Power Posing Techniques', 'Using your body to boost your confidence.', 'sports_gymnastics', '[{"type": "paragraph", "text": "Based on research by social psychologist Amy Cuddy, ''power posing'' involves holding expansive, open postures that can actually change your body''s chemistry. Spending just two minutes in a power pose before a high-stress situation can increase testosterone (the confidence hormone) and decrease cortisol (the stress hormone)."}, {"type": "heading", "text": "High-Power Poses (Do These!)"}, {"type": "list", "items": ["The ''Wonder Woman'': Stand with your feet apart, hands on your hips, and your chin slightly lifted.", "The ''CEO'': Lean back in a chair with your hands behind your head and your feet up on a desk.", "The ''Performer'': Stand with your arms raised in a ''V'' shape, as if you''ve just won a race."]}, {"type": "heading", "text": "Low-Power Poses (Avoid These!)"}, {"type": "paragraph", "text": "These poses make you feel smaller and less powerful:"}, {"type": "list", "items": ["Hunching over your phone or notes.", "Crossing your arms or legs tightly.", "Touching your neck or face."]}, {"type": "tip", "text": "Find a private space (like a bathroom stall or an empty office) two minutes before your speech. Hold one of the high-power poses and breathe deeply. It can make a noticeable difference in how you feel when you walk on stage."}]'),
('mindfulness', 'Confidence Building', 'Mindfulness for Public Speaking', 'Staying present and grounded under pressure.', 'self_improvement', '[{"type": "paragraph", "text": "Mindfulness is the practice of paying attention to the present moment without judgment. For speakers, it''s a powerful tool to manage anxiety, stay focused, and connect more authentically with the audience."}, {"type": "heading", "text": "Why Mindfulness Helps"}, {"type": "paragraph", "text": "Nervousness often comes from worrying about the future (''What if I forget my words?'') or dwelling on the past (''I messed up my last presentation.''). Mindfulness brings your focus back to the here and now, which is the only place you can actually control."}, {"type": "heading", "text": "Exercise 1: Grounding Exercise"}, {"type": "paragraph", "text": "Right before you speak, take 30 seconds to focus on the physical sensations around you. Feel your feet planted firmly on the floor. Notice the temperature of the air. Hear the low hum of the room. This simple act of grounding can pull you out of an anxious thought spiral."}, {"type": "heading", "text": "Exercise 2: The Body Scan"}, {"type": "paragraph", "text": "In the hours leading up to your speech, take 5 minutes to sit quietly and mentally scan your body from your toes to your head. Notice any areas of tension without trying to change them. Just acknowledging the tension (e.g., ''My shoulders feel tight'') can often help it release."}, {"type": "tip", "text": "During your speech, if you feel your mind racing, bring your attention back to one physical sensation—like the feeling of your breath, or the solidness of the lectern under your hands. This can serve as an anchor to keep you present."}]')
ON CONFLICT (id) DO NOTHING;

--------------------------------------------------------------------------------
-- 12. RPC FOR INITIAL DATA FETCHING
--------------------------------------------------------------------------------
-- This function fetches all necessary data for a user in a single request.
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