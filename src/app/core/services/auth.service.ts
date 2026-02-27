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
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return localStorage.getItem('userRole') === role;
  }


  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing access token...');
    console.log('Refresh Token:', refreshToken.substring(0, 20) + '...');

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
        console.log('✅ Access token refreshed successfully');
        console.log('New Access Token:', newAccessToken.substring(0, 20) + '...');
        return newAccessToken;
      }),
      tap(accessToken => {
        localStorage.setItem('accessToken', accessToken);
      })
    );
  }

}
