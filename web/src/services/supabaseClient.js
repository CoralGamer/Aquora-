import { createClient } from "@supabase/supabase-js";

// Safe public credentials fallback (standard public anon key)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ejlqwnpfpgnpmtffadbv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbHF3bnBmcGducG10ZmZhZGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzYyMjgsImV4cCI6MjA5NTQxMjIyOH0.EbF9N3KJozSsYT6TqZoOA7CKDXwHsfpgFpIIXhw7V3M";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
