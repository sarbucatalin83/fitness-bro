import { Injectable, signal, computed } from '@angular/core';
import { createClient, type SupabaseClient, type Session, type User, type AuthChangeEvent } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private _session = signal<Session | null>(null);
  private _user = signal<User | null>(null);
  private _loading = signal<boolean>(true);

  readonly session = this._session.asReadonly();
  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._session());

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      }
    );

    this.initSession();
  }

  private async initSession(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      this._session.set(session);
      this._user.set(session?.user ?? null);

      this.supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        this._session.set(session);
        this._user.set(session?.user ?? null);
      });
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      this._loading.set(false);
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  getAccessToken(): string | null {
    return this._session()?.access_token ?? null;
  }
}
