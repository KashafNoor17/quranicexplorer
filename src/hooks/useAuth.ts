import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError, logErrorForDebugging } from '@/lib/errorMessages';

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
        title: 'Account created!',
        description: 'Welcome to Quran Explorer. You are now signed in.',
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logErrorForDebugging(error, 'signIn');
        toast({
          title: 'Sign in failed',
          description: getUserFriendlyError(error, 'auth'),
          variant: 'destructive',
        });
        return { error };
      }

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
    signOut,
  };
}
