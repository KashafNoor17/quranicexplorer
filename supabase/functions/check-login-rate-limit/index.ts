import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RateLimitRequest {
  email: string;
  action: 'check' | 'record_success' | 'record_failure';
}

interface LockoutStatus {
  is_locked: boolean;
  failed_attempts: number;
  lockout_threshold: number;
  lockout_until: string | null;
  remaining_attempts: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, action }: RateLimitRequest = await req.json();

    if (!email || !action) {
      return new Response(
        JSON.stringify({ error: 'Email and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP from headers (may be forwarded by proxy)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';

    const normalizedEmail = email.toLowerCase().trim();

    if (action === 'check') {
      // Check if account is locked
      const { data: lockoutData, error: lockoutError } = await supabase.rpc(
        'check_account_lockout',
        { check_email: normalizedEmail }
      );

      if (lockoutError) {
        console.error('Lockout check error:', lockoutError);
        return new Response(
          JSON.stringify({ error: 'Failed to check lockout status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const status = lockoutData as LockoutStatus;
      
      return new Response(
        JSON.stringify({
          allowed: !status.is_locked,
          ...status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record_success') {
      // Record successful login
      const { error } = await supabase.rpc('record_login_attempt', {
        attempt_email: normalizedEmail,
        attempt_ip: clientIp,
        attempt_success: true
      });

      if (error) {
        console.error('Record success error:', error);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record_failure') {
      // Record failed login
      const { error: recordError } = await supabase.rpc('record_login_attempt', {
        attempt_email: normalizedEmail,
        attempt_ip: clientIp,
        attempt_success: false
      });

      if (recordError) {
        console.error('Record failure error:', recordError);
      }

      // Check new lockout status after recording failure
      const { data: lockoutData } = await supabase.rpc(
        'check_account_lockout',
        { check_email: normalizedEmail }
      );

      const status = lockoutData as LockoutStatus;

      return new Response(
        JSON.stringify({
          success: true,
          lockout_status: status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Rate limit function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
