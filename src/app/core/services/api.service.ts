import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   * @param endpoint - API endpoint (will be appended to baseUrl)
   * @param options - Optional request options
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options);
  }

  /**
   * POST request
   * @param endpoint - API endpoint (will be appended to baseUrl)
   * @param body - Request body
   * @param options - Optional request options
   */
  post<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options);
  }

  /**
   * PUT request
   * @param endpoint - API endpoint (will be appended to baseUrl)
   * @param body - Request body
   * @param options - Optional request options
   */
  put<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, options);
  }

  /**
   * DELETE request
   * @param endpoint - API endpoint (will be appended to baseUrl)
   * @param options - Optional request options
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options);
  }

  /**
   * PATCH request
   * @param endpoint - API endpoint (will be appended to baseUrl)
   * @param body - Request body
   * @param options - Optional request options
   */
  patch<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, options);
  }
}
