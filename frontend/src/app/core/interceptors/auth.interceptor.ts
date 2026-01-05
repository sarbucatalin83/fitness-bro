import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const supabaseService = inject(SupabaseService);

  // Only intercept requests to our backend
  if (!req.url.startsWith(environment.supabaseUrl)) {
    return next(req);
  }

  const token = supabaseService.getAccessToken();

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        apikey: environment.supabaseAnonKey
      }
    });
    return next(authReq);
  }

  // No token, add only apikey
  const apiKeyReq = req.clone({
    setHeaders: {
      apikey: environment.supabaseAnonKey
    }
  });
  return next(apiKeyReq);
};
