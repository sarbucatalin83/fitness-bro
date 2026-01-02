import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const authHeader = req.headers.get('Authorization');

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  return createClient(supabaseUrl, serviceKey);
}

export async function getUser(req: Request) {
  const supabase = createSupabaseClient(req);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
