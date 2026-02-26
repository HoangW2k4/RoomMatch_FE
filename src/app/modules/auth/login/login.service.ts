import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/base.interface';

// Request interfaces matching backend
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: string; // Optional, for ADMIN role
}

export interface ResetPasswordRequest {
  email: string;
  password: string; // New password
}

// Response interface matching backend JwtResponse
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

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly AUTH_BASE = '/auth';

  constructor(private apiService: ApiService) {}

  /**
   * Sign in user
   * POST /api/auth/signin
   */
  signin(loginRequest: LoginRequest): Observable<ApiResponse<JwtResponse>> {
    return this.apiService.post<ApiResponse<JwtResponse>>(
      `${this.AUTH_BASE}/signin`,
      loginRequest
    );
  }

  /**
   * Send OTP for signup
   * POST /api/auth/signup-otp
   */
  sendSignupOtp(email: string): Observable<ApiResponse<null>> {
    const formData = new FormData();
    formData.append('email', email);
    
    return this.apiService.post<ApiResponse<null>>(
      `${this.AUTH_BASE}/signup-otp`,
      formData
    );
  }

  /**
   * Register new user with OTP verification
   * POST /api/auth/signup
   */
  signup(signupRequest: SignupRequest, otp: string): Observable<ApiResponse<JwtResponse>> {
    const formData = new FormData();
    formData.append('fullName', signupRequest.fullName);
    formData.append('email', signupRequest.email);
    formData.append('password', signupRequest.password);
    formData.append('phoneNumber', signupRequest.phoneNumber);
    if (signupRequest.role) {
      formData.append('role', signupRequest.role);
    }
    formData.append('otp', otp);

    return this.apiService.post<ApiResponse<JwtResponse>>(
      `${this.AUTH_BASE}/signup`,
      formData
    );
  }

  /**
   * Send OTP for reset password
   * POST /api/auth/reset-password-otp
   */
  sendResetPasswordOtp(email: string): Observable<ApiResponse<null>> {
    const formData = new FormData();
    formData.append('email', email);
    
    return this.apiService.post<ApiResponse<null>>(
      `${this.AUTH_BASE}/reset-password-otp`,
      formData
    );
  }

  /**
   * Reset password with OTP verification
   * POST /api/auth/reset-password
   */
  resetPassword(resetPasswordRequest: ResetPasswordRequest, otp: string): Observable<ApiResponse<JwtResponse>> {
    const formData = new FormData();
    formData.append('email', resetPasswordRequest.email);
    formData.append('password', resetPasswordRequest.password);
    formData.append('otp', otp);

    return this.apiService.post<ApiResponse<JwtResponse>>(
      `${this.AUTH_BASE}/reset-password`,
      formData
    );
  }
}
