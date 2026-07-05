import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
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

export interface CurrentUser {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
  gender?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }



  get isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  get currentUserId(): string | null {
    const id = this.currentUserSubject.value?.id;
    return id ? String(id) : null;
  }

  updateCurrentUser(user: CurrentUser): void {
    const current = this.currentUserSubject.value ?? {};
    const avatar = user.avatarUrl || user.avatar || current.avatarUrl || current.avatar;
    const fullName = user.fullName || user.name || current.fullName || current.name;
    const updated: CurrentUser = {
      ...current,
      ...user,
      name: fullName,
      fullName,
      avatar,
      avatarUrl: avatar
    };

    localStorage.setItem('user', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  private readStoredUser(): CurrentUser | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
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
    return this.currentUserSubject.value?.role === role;
  }


  logout(): void {
    this.http.post<ApiResponse<string>>(`${environment.apiUrl}/auth/signout`, {}).subscribe({
      next: () => {
        this.clearLocalData();
      },
      error: (err) => {
        console.error('Error during logout API call', err);
        // Still clear local data even if backend call fails to ensure user is logged out locally
        this.clearLocalData();
      }
    });
  }

  private clearLocalData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
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
        window.dispatchEvent(new CustomEvent('roommatch:access-token-changed', { detail: accessToken }));
      })
    );
  }

}
