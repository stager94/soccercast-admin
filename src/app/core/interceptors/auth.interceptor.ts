import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, switchMap, throwError, catchError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const NO_AUTH_URLS = ['/admin/auth/login', '/admin/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isNoAuth = NO_AUTH_URLS.some((url) => req.url.includes(url));

  let outReq = req.clone({ withCredentials: true });

  const token = authService.getAccessToken();
  if (!isNoAuth && token) {
    outReq = outReq.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  if (isNoAuth) {
    return next(outReq);
  }

  return next(outReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && error.error?.code === 'token_expired') {
        return from(authService.refresh()).pipe(
          switchMap((success) => {
            if (success) {
              const newToken = authService.getAccessToken();
              const retryReq = newToken
                ? outReq.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } })
                : outReq;
              return next(retryReq);
            }
            router.navigate(['/login']);
            return throwError(() => error);
          }),
        );
      }

      if (error.status === 401) {
        authService.clearAccessToken();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
