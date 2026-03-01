import { Injectable } from '@angular/core';
import { Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../models/base.interface';
import { environment } from '../../../environments/environment';


// JWT Response from backend
export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}



  get isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Get cookie value by name
   */
  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.role === role;
  }


  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.getCookie('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<ApiResponse<string>>(
      `${environment.apiUrl}/auth/refresh-access`, 
      {},
      {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      }
    ).pipe(
      map(apiResponse => {
        const newAccessToken = apiResponse.data!;
        return newAccessToken;
      }),
      tap(accessToken => {
        localStorage.setItem('accessToken', accessToken);
      })
    );
  }

}
