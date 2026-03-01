import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent, HttpClient, HttpBackend } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, filter, take, BehaviorSubject, Observable } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { ApiResponse } from '../models/base.interface';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const httpBackend = inject(HttpBackend);
  const alertService = inject(AlertService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', {
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error.error
      });

      if (error.error instanceof ErrorEvent) {
        console.error('Client-side error:', error.error.message);
      } else {
        switch (error.status) {
          case 401:
            const isAuthEndpoint = req.url.includes('/auth/') || req.url.includes('/refresh-access');
            
            if (isAuthEndpoint) {
              console.warn('Auth endpoint failed - clearing session');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('user');
              document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
              router.navigate(['/auth/login']);
              alertService.show('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.');
            } else {
              return handle401Error(req, next, httpBackend, router, alertService);
            }
            break;

          case 403:
            // Forbidden - access denied
            console.error('Access denied:', error.error);
            alertService.show('warning', 'Không có quyền truy cập', 'Bạn không có quyền thực hiện thao tác này.');
            break;

          case 404:
            console.warn('Resource not found:', error.url);
            alertService.show('info', 'Không tìm thấy dữ liệu', 'Tài nguyên bạn yêu cầu không tồn tại hoặc đã bị xóa.');
            break;

          case 500:
            console.error('Server error:', error.error);
            alertService.show('error', 'Lỗi hệ thống', 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.');
            break;
        }
      }

      return throwError(() => error);
    })
  );
};


function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  httpBackend: HttpBackend,
  router: Router,
  alertService: AlertService
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = document.cookie.match(/(?:^|; )refreshToken=([^;]*)/)?.at(1) ?? null;
    
    if (!refreshToken) {
      isRefreshing = false;
      clearSessionAndRedirect(router);
      alertService.show('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.');
      return throwError(() => new Error('No refresh token'));
    }

    return refreshAccessToken(refreshToken, httpBackend).pipe(
      switchMap((newAccessToken: string) => {
        isRefreshing = false;
        refreshTokenSubject.next(newAccessToken);
        
        const clonedReq = addTokenToRequest(req, newAccessToken);
        return next(clonedReq);
      }),
      catchError((err) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        console.error('Refresh token failed:', err);
        clearSessionAndRedirect(router);
        alertService.show('error', 'Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.');
        return throwError(() => err);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null), 
    take(1),
    switchMap(token => {
      const clonedReq = addTokenToRequest(req, token!);
      return next(clonedReq);
    })
  );
}

/**
 * Thêm token vào request header
 */
function addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function refreshAccessToken(refreshToken: string, httpBackend: HttpBackend): Observable<string> {
  const http = new HttpClient(httpBackend);

  return http.post<ApiResponse<string>>(
    `${environment.apiUrl}/auth/refresh-access`,
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    }
  ).pipe(
    switchMap((apiResponse) => {
      const newAccessToken = apiResponse.data;
      if (!newAccessToken) {
        return throwError(() => new Error('Refresh access token response is invalid'));
      }

      localStorage.setItem('accessToken', newAccessToken);
      return [newAccessToken];
    })
  );
}

function clearSessionAndRedirect(router: Router): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  router.navigate(['/auth/login']);
}
