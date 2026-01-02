import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Wait for initial session check to complete
  while (supabaseService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (supabaseService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const publicGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Wait for initial session check to complete
  while (supabaseService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (!supabaseService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/programs']);
};
