import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-zinc-950 flex flex-col justify-center px-6 py-12">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">Create Account</h1>
        <p class="text-zinc-400 mt-2">Start your fitness journey today</p>
      </div>

      <!-- Signup Form -->
      <div class="bg-zinc-900 rounded-2xl p-6">
        @if (authService.error()) {
          <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <p class="text-red-400 text-sm">{{ authService.error() }}</p>
          </div>
        }

        @if (confirmationMessage()) {
          <div class="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
            <p class="text-green-400 text-sm">{{ confirmationMessage() }}</p>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
            <input
              type="text"
              [(ngModel)]="displayName"
              name="displayName"
              class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Password</label>
            <div class="relative">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                required
                minlength="6"
                class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors pr-12"
                placeholder="Create a password"
              />
              <button
                type="button"
                (click)="togglePassword()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                @if (showPassword()) {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              </button>
            </div>
            <p class="text-xs text-zinc-500 mt-2">Must be at least 6 characters</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-zinc-400 mb-2">Confirm Password</label>
            <input
              [type]="showPassword() ? 'text' : 'password'"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              required
              class="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              [class.border-red-500]="password && confirmPassword && password !== confirmPassword"
              placeholder="Confirm your password"
            />
            @if (password && confirmPassword && password !== confirmPassword) {
              <p class="text-xs text-red-400 mt-2">Passwords don't match</p>
            }
          </div>

          <button
            type="submit"
            [disabled]="authService.isSubmitting() || (password !== confirmPassword)"
            class="w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (authService.isSubmitting()) {
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            } @else {
              Create Account
            }
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-zinc-400">
            Already have an account?
            <a routerLink="/login" class="text-orange-500 hover:text-orange-400 font-medium ml-1">
              Sign In
            </a>
          </p>
        </div>
      </div>

      <!-- Terms -->
      <p class="text-center text-xs text-zinc-500 mt-6 px-4">
        By creating an account, you agree to our
        <a href="#" class="text-orange-500">Terms of Service</a>
        and
        <a href="#" class="text-orange-500">Privacy Policy</a>
      </p>
    </div>
  `
})
export class SignupComponent {
  authService = inject(AuthService);

  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';

  showPassword = signal(false);
  confirmationMessage = signal<string | null>(null);

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    if (this.password !== this.confirmPassword) return;
    if (this.password.length < 6) return;

    const result = await this.authService.signUp({
      email: this.email,
      password: this.password,
      displayName: this.displayName || undefined
    });

    if (result.success && result.error) {
      // Email confirmation needed
      this.confirmationMessage.set(result.error);
    }
  }
}
