import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { UserRole } from '../models/enums';
import { ApiResponse } from '../models/base.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role?: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
}

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
  user: User;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  /**
   * Get user from localStorage
   */
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Get current user
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Login - POST /api/auth/signin
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<ApiResponse<JwtResponse>>('/auth/signin', credentials).pipe(
      map(apiResponse => this.transformJwtResponse(apiResponse.data!)),
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Send OTP for signup
   */
  sendSignupOtp(email: string): Observable<void> {
    const formData = new FormData();
    formData.append('email', email);
    
    return this.apiService.post<ApiResponse<null>>('/auth/signup-otp', formData).pipe(
      map(() => undefined)
    );
  }

  /**
   * Register with OTP - POST /api/auth/signup
   */
  register(data: RegisterRequest, otp: string): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phoneNumber', data.phoneNumber);
    if (data.role) {
      formData.append('role', data.role);
    }
    formData.append('otp', otp);

    return this.apiService.post<ApiResponse<JwtResponse>>('/auth/signup', formData).pipe(
      map(apiResponse => this.transformJwtResponse(apiResponse.data!)),
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Send OTP for reset password
   */
  sendResetPasswordOtp(email: string): Observable<void> {
    const formData = new FormData();
    formData.append('email', email);
    
    return this.apiService.post<ApiResponse<null>>('/auth/reset-password-otp', formData).pipe(
      map(() => undefined)
    );
  }

  /**
   * Reset password with OTP - POST /api/auth/reset-password
   */
  resetPassword(data: ResetPasswordRequest, otp: string): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('otp', otp);

    return this.apiService.post<ApiResponse<JwtResponse>>('/auth/reset-password', formData).pipe(
      map(apiResponse => this.transformJwtResponse(apiResponse.data!)),
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Transform JwtResponse to AuthResponse
   */
  private transformJwtResponse(jwtResponse: JwtResponse): AuthResponse {
    return {
      accessToken: jwtResponse.accessToken,
      refreshToken: jwtResponse.refreshToken,
      user: {
        id: jwtResponse.id,
        email: jwtResponse.email,
        fullName: jwtResponse.fullName,
        phoneNumber: jwtResponse.phoneNumber,
        role: jwtResponse.role,
        avatarUrl: jwtResponse.avatarUrl
      }
    };
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Set session data
   */
  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem('accessToken', authResponse.accessToken);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
    this.currentUserSubject.next(authResponse.user);
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.apiService.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.accessToken);
      })
    );
  }

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): Observable<User> {
    return this.apiService.get<User>('/users/me').pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }
}
