import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Auto-correction: If the URL is just a project ID (no http), construct the full URL
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    console.log('Supabase: URL provided seems to be a project ID. Constructing full URL...');
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

console.log('Supabase: Initializing with URL:', supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Missing Supabase environment variables! Check your .env file.');
    console.error('Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

// Defensive client creation to prevent silent crashes
let supabase: SupabaseClient;
try {
    if (!supabaseUrl) throw new Error('Supabase URL is required but missing from env.');
    if (!supabaseAnonKey) throw new Error('Supabase Anon Key is required but missing from env.');

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
    console.log('✅ Supabase: Client created successfully.');
} catch (error) {
    console.error('❌ Supabase: Failed to create client:', error);
    // Create a dummy client to prevent secondary crashes in components
    supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
}

export { supabase };
