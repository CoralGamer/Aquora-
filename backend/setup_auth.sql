-- ==============================================================================
-- AQUORA - SQL SETUP FOR SUPABASE AUTH & ROLE-BASED ACCESS CONTROL (RBAC)
-- ==============================================================================
-- Instructions: Copy this entire SQL script and run it in the "SQL Editor"
-- of your Supabase Dashboard (https://supabase.com) to automatically set up the
-- user_profiles table, triggers, and Row Level Security (RLS) rules!
-- ==============================================================================

-- 1. Create the user_profiles table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'community_member')) NOT NULL DEFAULT 'community_member',
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL UNIQUE,
    notification_preferences JSONB DEFAULT '{"email": true, "whatsapp": false, "tds_threshold": 400.0, "turbidity_threshold": 5.0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow anyone to read profiles (useful for listing members or verifying metadata)
CREATE POLICY "Permitir lectura publica de perfiles" 
ON public.user_profiles FOR SELECT 
USING (true);

-- Allow users to update their own profiles (such as notification preferences)
CREATE POLICY "Permitir a cada usuario actualizar su propio perfil" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- Allow inserting profiles (primarily handled by the PostgreSQL trigger)
CREATE POLICY "Permitir insercion total"
ON public.user_profiles FOR INSERT
WITH CHECK (true);

-- Allow deleting profiles
CREATE POLICY "Permitir eliminacion de perfiles"
ON public.user_profiles FOR DELETE
USING (auth.uid() = id OR (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin');

-- 4. PostgreSQL Trigger Function to auto-create public profiles upon Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, device_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Miembro'),
    COALESCE(new.raw_user_meta_data->>'role', 'community_member'),
    CASE 
      WHEN new.raw_user_meta_data->>'device_id' IS NOT NULL AND new.raw_user_meta_data->>'device_id' <> ''
      THEN (new.raw_user_meta_data->>'device_id')::uuid
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Bind the trigger to auth.users insertion
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SQL Script generated successfully. You can now execute this in your Supabase SQL Editor.
