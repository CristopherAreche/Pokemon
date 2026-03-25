import 'server-only';

import { createClient } from '@supabase/supabase-js';

const getRequiredServerEnv = (
  name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY'
) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const supabaseUrl = getRequiredServerEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getRequiredServerEnv('SUPABASE_SERVICE_ROLE_KEY');

// Server-only admin client. Never import this from client components.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
