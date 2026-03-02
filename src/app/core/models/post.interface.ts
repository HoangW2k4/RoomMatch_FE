import { PostStatus, RepostStatus } from './enums';

// ===== Sub-models =====

export interface Address {
  provinceCode: string;
  provinceName?: string;
  districtCode: string;
  districtName?: string;
  wardCode: string;
  wardName?: string;
  street?: string;
  fullAddress: string;
  addressUrl?: string;
}

export interface AddressRequest {
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  street: string;
}

export interface PostMedia {
  url: string;
  type: string;          // e.g. 'image/jpeg', 'image/png', 'video/mp4'
  displayOrder: number;
}

export interface Amenity {
  code: string;
  name: string;
  icon?: string;
}

export interface PostStatistics {
  viewCount: number;
  saveCount: number;
  commentCount: number;
  shareCount: number;
}

// ===== Room Post =====

export interface RoomPostResponse {
  id: string;
  landlordId: string;
  landlordInfo?: LandlordInfo;
  title: string;
  price: number;
  deposit: number;
  area: number;
  peoples: number | null;
  address: Address;
  medias: PostMedia[];
  statistics: PostStatistics;
  createdAt: string;
  likedByCurrentUser: boolean;
}

export interface LandlordInfo {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface RoomPostDetailResponse {
  id: string;
  landlordInfo: LandlordInfo;
  title: string;
  description: string;
  price: number;
  deposit: number;
  area: number;
  peoples: number | null;
  address: Address;
  medias: PostMedia[];
  amenities: Amenity[];
  statistics: PostStatistics;
  status: PostStatus;
  createdAt: string;
}

export interface RoomPostRequest {
  title: string;
  description: string;
  price: number;
  deposit: number;
  peoples: number;
  area: number;
  addressRequest: AddressRequest;
  medias: PostMedia[];
  amenities: Amenity[];
}

// ===== Comment =====

export interface CommentResponse {
  id: string;
  userId: string;
  targetId: string;
  content: string;
  createdAt: string;
  userFullName: string;
  userAvatarUrl: string;
  isDeleted: boolean;
  childComments: CommentResponse[];
}

export interface CommentRequest {
  targetId: string;
  content: string;
  parentId?: string;
}

// ===== Repost =====

export interface SeekerInfoSnapshot {
  name: string;
  gender: string;
  age: number;
  occupation: string;
  description: string;
}

export interface RePostResponse {
  id: string;
  seekerId: string;
  originalPost: RoomPostResponse;
  caption: string;
  seekerInfo: SeekerInfoSnapshot;
  createdAt: string;
}

export interface RePostRequest {
  originalPostId: string;
  caption: string;
  seekerInfo: SeekerInfoSnapshot;
}

// ===== Search =====

export interface RoomSearchRequest {
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  targetArea?: number;
}

export interface RepostSearchRequest {
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: string;
  minAge?: number;
  maxAge?: number;
  keyword?: string;
}

// ===== Location (for address dropdowns) =====

export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
}

export interface Ward {
  code: string;
  name: string;
}
