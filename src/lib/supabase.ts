import { createClient } from '@supabase/supabase-js';

// Create Supabase client for client-side operations
export const supabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key);
};

// Initialize Supabase client (for use in client components)
let supabaseClientInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClientInstance) {
    supabaseClientInstance = supabaseClient() as ReturnType<typeof createClient>;
  }
  return supabaseClientInstance;
};

// Helper for server-side operations (if needed)
export const createServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase service role key');
  }
  
  return createClient(url, key);
};
