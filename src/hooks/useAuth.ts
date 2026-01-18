import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError, logErrorForDebugging } from '@/lib/errorMessages';

interface LockoutStatus {
  is_locked: boolean;
  failed_attempts: number;
  lockout_threshold: number;
  lockout_until: string | null;
  remaining_attempts: number;
}

interface RateLimitResponse {
  allowed?: boolean;
  success?: boolean;
  lockout_status?: LockoutStatus;
  is_locked?: boolean;
  remaining_attempts?: number;
  lockout_until?: string | null;
  error?: string;
}

async function checkRateLimit(email: string, action: 'check' | 'record_success' | 'record_failure'): Promise<RateLimitResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('check-login-rate-limit', {
      body: { email, action }
    });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      // Don't block login if rate limit check fails
      return { allowed: true };
    }
    
    return data as RateLimitResponse;
  } catch (err) {
    console.error('Rate limit service error:', err);
    // Don't block login if service is unavailable
    return { allowed: true };
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        logErrorForDebugging(error, 'signUp');
        toast({
          title: 'Sign up failed',
          description: getUserFriendlyError(error, 'auth'),
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Verification email sent!',
        description: 'Please check your email and click the verification link to complete your registration.',
      });

      return { data, error: null };
    } catch (error) {
      logErrorForDebugging(error, 'signUp');
      toast({
        title: 'Sign up failed',
        description: getUserFriendlyError(error, 'auth'),
        variant: 'destructive',
      });
      return { error };
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Check rate limit before attempting login
      const rateLimitCheck = await checkRateLimit(email, 'check');
      
      if (!rateLimitCheck.allowed && rateLimitCheck.is_locked) {
        const lockoutUntil = rateLimitCheck.lockout_until 
          ? new Date(rateLimitCheck.lockout_until).toLocaleTimeString() 
          : 'a few minutes';
        
        toast({
          title: 'Account temporarily locked',
          description: `Too many failed login attempts. Please try again after ${lockoutUntil}.`,
          variant: 'destructive',
        });
        return { error: new Error('Account locked due to too many failed attempts') };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed attempt
        const failureResult = await checkRateLimit(email, 'record_failure');
        
        logErrorForDebugging(error, 'signIn');
        
        let description = getUserFriendlyError(error, 'auth');
        
        // Add remaining attempts warning if close to lockout
        if (failureResult.lockout_status && failureResult.lockout_status.remaining_attempts <= 2) {
          description += ` (${failureResult.lockout_status.remaining_attempts} attempts remaining before lockout)`;
        }
        
        toast({
          title: 'Sign in failed',
          description,
          variant: 'destructive',
        });
        return { error };
      }

      // Record successful login
      await checkRateLimit(email, 'record_success');

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

      return { data, error: null };
    } catch (error) {
      logErrorForDebugging(error, 'signIn');
      toast({
        title: 'Sign in failed',
        description: getUserFriendlyError(error, 'auth'),
        variant: 'destructive',
      });
      return { error };
    }
  }, [toast]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        logErrorForDebugging(error, 'signInWithGoogle');
        toast({
          title: 'Google sign in failed',
          description: getUserFriendlyError(error, 'auth'),
          variant: 'destructive',
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      logErrorForDebugging(error, 'signInWithGoogle');
      toast({
        title: 'Google sign in failed',
        description: getUserFriendlyError(error, 'auth'),
        variant: 'destructive',
      });
      return { error };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logErrorForDebugging(error, 'signOut');
        toast({
          title: 'Sign out failed',
          description: getUserFriendlyError(error, 'auth'),
          variant: 'destructive',
        });
        return { error };
      }
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });

      return { error: null };
    } catch (error) {
      logErrorForDebugging(error, 'signOut');
      toast({
        title: 'Sign out failed',
        description: getUserFriendlyError(error, 'auth'),
        variant: 'destructive',
      });
      return { error };
    }
  }, [toast]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}
