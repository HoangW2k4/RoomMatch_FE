import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error
      });

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        console.error('Client-side error:', error.error.message);
      } else {
        // Server-side error - handle special cases
        switch (error.status) {
          case 401:
            // Unauthorized - clear token and redirect to login
            console.warn('Unauthorized access - clearing session');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            // router.navigate(['/auth/login']);
            break;

          case 403:
            // Forbidden - access denied
            console.error('Access denied:', error.error);
            break;

          case 404:
            console.warn('Resource not found:', error.url);
            break;

          case 500:
            console.error('Server error:', error.error);
            break;
        }
      }

      // Return the original error object so components can access error.error.message
      return throwError(() => error);
    })
  );
};
