import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Đã xảy ra lỗi';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Lỗi: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            // Unauthorized - clear token and redirect to login
            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            router.navigate(['/auth/login']);
            break;

          case 403:
            // Forbidden - access denied
            errorMessage = 'Bạn không có quyền truy cập tài nguyên này.';
            console.error('Access denied:', error.error);
            break;

          case 404:
            errorMessage = 'Không tìm thấy tài nguyên.';
            break;

          case 500:
            errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
            break;

          default:
            errorMessage = error.error?.message || `Lỗi ${error.status}: ${error.statusText}`;
        }
      }

      console.error('HTTP Error:', {
        status: error.status,
        message: errorMessage,
        url: error.url,
        error: error.error
      });

      // You can also show a toast/notification here
      // this.notificationService.showError(errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};
