import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ejlqwnpfpgnpmtffadbv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbHF3bnBmcGducG10ZmZhZGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzYyMjgsImV4cCI6MjA5NTQxMjIyOH0.EbF9N3KJozSsYT6TqZoOA7CKDXwHsfpgFpIIXhw7V3M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
