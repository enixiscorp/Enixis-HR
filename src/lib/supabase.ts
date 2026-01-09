import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase: Initializing with URL:', supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Missing Supabase environment variables! Check your Vercel settings.');
}

// Defensive client creation to prevent silent crashes
let supabase;
try {
    if (!supabaseUrl) throw new Error('Supabase URL is required but missing from env.');
    if (!supabaseAnonKey) throw new Error('Supabase Anon Key is required but missing from env.');

    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase: Client created successfully.');
} catch (error) {
    console.error('Supabase: Failed to create client:', error);
    // Create a dummy client or null to prevent subsequent crashes, 
    // but the app will likely be broken anyway.
    supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
}

export { supabase };
