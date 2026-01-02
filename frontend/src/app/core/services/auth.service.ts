import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  displayName?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  private _error = signal<string | null>(null);
  private _isSubmitting = signal<boolean>(false);

  readonly error = this._error.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly user = this.supabaseService.user;
  readonly isAuthenticated = this.supabaseService.isAuthenticated;
  readonly loading = this.supabaseService.loading;

  async signUp(data: SignUpData): Promise<AuthResult> {
    this._error.set(null);
    this._isSubmitting.set(true);

    try {
      const { data: authData, error } = await this.supabaseService.client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
          }
        }
      });

      if (error) {
        this._error.set(error.message);
        return { success: false, error: error.message };
      }

      if (authData.user && !authData.session) {
        return {
          success: true,
          error: 'Please check your email to confirm your account.'
        };
      }

      await this.router.navigate(['/programs']);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      this._error.set(message);
      return { success: false, error: message };
    } finally {
      this._isSubmitting.set(false);
    }
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    this._error.set(null);
    this._isSubmitting.set(true);

    try {
      const { error } = await this.supabaseService.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        this._error.set(error.message);
        return { success: false, error: error.message };
      }

      await this.router.navigate(['/programs']);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      this._error.set(message);
      return { success: false, error: message };
    } finally {
      this._isSubmitting.set(false);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.supabaseService.client.auth.signOut();
      await this.router.navigate(['/login']);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    this._error.set(null);
    this._isSubmitting.set(true);

    try {
      const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        this._error.set(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      this._error.set(message);
      return { success: false, error: message };
    } finally {
      this._isSubmitting.set(false);
    }
  }

  async updatePassword(newPassword: string): Promise<AuthResult> {
    this._error.set(null);
    this._isSubmitting.set(true);

    try {
      const { error } = await this.supabaseService.client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        this._error.set(error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      this._error.set(message);
      return { success: false, error: message };
    } finally {
      this._isSubmitting.set(false);
    }
  }

  clearError(): void {
    this._error.set(null);
  }
}
