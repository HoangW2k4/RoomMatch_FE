import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { ApiResponse } from '../../core/models/base.interface';

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  email: string;
  avatarUrl: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private api: ApiService) {}

  getUserInfo(userId: string): Observable<ApiResponse<UserProfile>> {
    return this.api.get<ApiResponse<UserProfile>>('/account/info', {
      params: new HttpParams().set('userId', userId)
    });
  }
}
