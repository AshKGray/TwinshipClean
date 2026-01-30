import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

class AuthService {
  async signUp(
    email: string,
    password: string,
    profileData: { name: string; birthdate?: string; twinType?: string; accentColor?: string }
  ): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: profileData.name,
            twin_type: profileData.twinType || 'identical',
            accent_color: profileData.accentColor || 'celestial-indigo',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Create profile and user_settings (upsert handles trigger race condition)
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          name: profileData.name,
          twin_type: profileData.twinType || 'identical',
          accent_color: profileData.accentColor || 'celestial-indigo',
        }, { onConflict: 'id' });

        await supabase.from('user_settings').upsert({
          user_id: data.user.id,
        }, { onConflict: 'user_id' });
      }

      return {
        success: true,
        user: data.user ?? undefined,
        session: data.session ?? undefined,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset failed' };
    }
  }

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  async getUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  onAuthStateChange(callback: (user: User | null, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null, session);
    });
  }
}

export const authService = new AuthService();
