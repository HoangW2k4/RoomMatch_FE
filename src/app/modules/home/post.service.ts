import { LoadingService } from './../../core/services/loading.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../core/models/base.interface';
import {
  RoomPostResponse,
  RoomPostDetailResponse,
  RoomPostRequest,
  CommentResponse,
  CommentRequest,
  RePostResponse,
  RePostRequest,
  RoomSearchRequest,
  RepostSearchRequest
} from '../../core/models/post.interface';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly basePath = '/post';
  private LoadingService : LoadingService;
  
  constructor(private api: ApiService, private loadingService: LoadingService) {
    this.LoadingService = loadingService;
  }

  searchPosts(filters: RoomSearchRequest, page = 1, size = 10): Observable<ApiResponse<PaginatedResponse<RoomPostResponse>>> {
    this.LoadingService.show();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (filters.provinceCode) params = params.set('provinceCode', filters.provinceCode);
    if (filters.districtCode) params = params.set('districtCode', filters.districtCode);
    if (filters.wardCode) params = params.set('wardCode', filters.wardCode);
    if (filters.minPrice != null) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice != null) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.targetArea != null) params = params.set('targetArea', filters.targetArea.toString());
    this.LoadingService.hide();
    return this.api.get<ApiResponse<PaginatedResponse<RoomPostResponse>>>(`${this.basePath}/search`, { params });
  }

  /**
   * Get post detail by id
   */
  getPostDetail(postId: string): Observable<ApiResponse<RoomPostDetailResponse>> {
    return this.api.get<ApiResponse<RoomPostDetailResponse>>(`${this.basePath}/detail`, {
      params: new HttpParams().set('postId', postId)
    });
  }

  /**
   * Create a new room post (landlord only)
   */
  createPost(data: RoomPostRequest, files: File[]): Observable<ApiResponse<RoomPostResponse>> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    files.forEach(file => formData.append('files', file));
    return this.api.post<ApiResponse<RoomPostResponse>>(`${this.basePath}/create-post`, formData);
  }

  /**
   * Change post status (landlord only)
   */
  changePostStatus(postId: string, status: string): Observable<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('postId', postId);
    formData.append('status', status);
    return this.api.post<ApiResponse<void>>(`${this.basePath}/change-status`, formData);
  }

  /**
   * Delete a post
   */
  deletePost(postId: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/delete`, {
      params: new HttpParams().set('postId', postId)
    });
  }

  /**
   * Get all posts by current landlord
   */
  getPostsByLandlord(landlordId: string, page = 1, size = 10): Observable<ApiResponse<PaginatedResponse<RoomPostResponse>>> {
    return this.api.get<ApiResponse<PaginatedResponse<RoomPostResponse>>>(`${this.basePath}/all-by-landlord`, {
      params: new HttpParams()
        .set('landlordId', landlordId)
        .set('page', page.toString())
        .set('size', size.toString())
    });
  }

  // ===== Like =====

  /**
   * Toggle like on a post
   */
  likePost(postId: string): Observable<ApiResponse<string>> {
    return this.api.get<ApiResponse<string>>(`${this.basePath}/like`, {
      params: new HttpParams().set('postId', postId)
    });
  }

  /**
   * Get all liked posts by current user
   */
  getLikedPosts(page = 1, size = 10): Observable<ApiResponse<PaginatedResponse<RoomPostResponse>>> {
    return this.api.get<ApiResponse<PaginatedResponse<RoomPostResponse>>>(`${this.basePath}/liked-posts`, {
      params: new HttpParams().set('page', page.toString()).set('size', size.toString())
    });
  }

  // ===== Comments =====

  /**
   * Add a comment to a post
   */
  addComment(request: CommentRequest): Observable<ApiResponse<void>> {
    return this.api.post<ApiResponse<void>>(`${this.basePath}/comment`, request);
  }

  /**
   * Get all comments for a post
   */
  getComments(postId: string): Observable<ApiResponse<CommentResponse[]>> {
    return this.api.get<ApiResponse<CommentResponse[]>>(`${this.basePath}/comments`, {
      params: new HttpParams().set('postId', postId)
    });
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/delete-comment`, {
      params: new HttpParams().set('commentId', commentId)
    });
  }

  // ===== Repost =====

  /**
   * Create a repost (seeker only)
   */
  createRepost(request: RePostRequest): Observable<ApiResponse<void>> {
    return this.api.post<ApiResponse<void>>(`${this.basePath}/repost`, request);
  }

  /**
   * Get repost by current user
   */
  getMyRepost(): Observable<ApiResponse<RePostResponse>> {
    return this.api.get<ApiResponse<RePostResponse>>(`${this.basePath}/get-repost`);
  }

  /**
   * Delete current user's repost
   */
  deleteRepost(): Observable<ApiResponse<void>> {
    return this.api.delete<ApiResponse<void>>(`${this.basePath}/delete-repost`);
  }

  /**
   * Search reposts with filters and pagination
   */
  searchReposts(filters: RepostSearchRequest, page = 1, size = 10): Observable<ApiResponse<PaginatedResponse<RePostResponse>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (filters.provinceCode) params = params.set('provinceCode', filters.provinceCode);
    if (filters.districtCode) params = params.set('districtCode', filters.districtCode);
    if (filters.wardCode) params = params.set('wardCode', filters.wardCode);
    if (filters.minPrice != null) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice != null) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.gender) params = params.set('gender', filters.gender);
    if (filters.minAge != null) params = params.set('minAge', filters.minAge.toString());
    if (filters.maxAge != null) params = params.set('maxAge', filters.maxAge.toString());

    return this.api.get<ApiResponse<PaginatedResponse<RePostResponse>>>(`${this.basePath}/search-reposts`, { params });
  }
}
