# RoomMatch Frontend - Cấu trúc dự án

Dự án **RoomMatch** là một ứng dụng web Angular để kết nối người tìm phòng trọ và chủ nhà trọ.

## 📁 Cấu trúc thư mục

```
src/
├── assets/                  # Ảnh, icons, fonts chung
├── environments/            # Cấu hình API cho dev/prod
│   ├── environment.ts       # Development config
│   └── environment.prod.ts  # Production config
│
├── app/
│   ├── core/                # Singleton services, guards, interceptors
│   │   ├── guards/          
│   │   │   ├── auth.guard.ts        # Kiểm tra đăng nhập
│   │   │   └── role.guard.ts        # Kiểm tra vai trò (ROLE_SEEKER/ROLE_LANDLORD)
│   │   ├── interceptors/    
│   │   │   ├── auth.interceptor.ts  # Gắn JWT vào request
│   │   │   └── error.interceptor.ts # Xử lý lỗi HTTP
│   │   ├── services/        
│   │   │   ├── auth.service.ts      # Quản lý authentication
│   │   │   └── api.service.ts       # Base API wrapper
│   │   └── models/          
│   │       ├── enums.ts             # UserRole, PostStatus, etc.
│   │       └── base.interface.ts    # Base interfaces
│   │
│   ├── shared/              # Components, Pipes, Directives dùng chung
│   │   ├── components/      
│   │   │   ├── post-card/           # Card hiển thị bài đăng
│   │   │   ├── comment-item/        # Item hiển thị comment
│   │   │   ├── user-avatar/         # Avatar người dùng
│   │   │   └── loading-spinner/     # Spinner loading
│   │   ├── pipes/           
│   │   │   ├── time-ago.pipe.ts     # Format thời gian (5 phút trước)
│   │   │   └── currency-vnd.pipe.ts # Format tiền VNĐ
│   │   └── directives/      
│   │       └── click-outside.directive.ts # Phát hiện click bên ngoài
│   │
│   ├── data/                # Interface/model dựa trên thiết kế DB
│   │   ├── schema/          
│   │   │   ├── user.model.ts        # User, UserProfile
│   │   │   ├── room-post.model.ts   # RoomPost, SearchFilters
│   │   │   ├── repost.model.ts      # Repost (Tìm người ở ghép)
│   │   │   ├── conversation.model.ts # Chat conversation
│   │   │   └── notification.model.ts # Notification
│   │   └── constants/       
│   │       ├── provinces.ts         # Danh sách tỉnh thành VN
│   │       └── amenities.ts         # Danh sách tiện ích (Wifi, Điều hòa...)
│   │
│   ├── layout/              # Các khung giao diện chính
│   │   ├── navbar/          # Thanh điều hướng
│   │   ├── footer/          # Footer
│   │   └── main-layout/     # Layout chính với router-outlet
│   │
│   ├── modules/             # Feature Modules
│   │   ├── auth/            
│   │   │   ├── login/              # Đăng nhập
│   │   │   └── register/           # Đăng ký
│   │   ├── home/            # Trang chủ
│   │   ├── search/          # Tìm kiếm và bộ lọc
│   │   ├── room/            
│   │   │   ├── pages/
│   │   │   │   ├── room-detail/    # Chi tiết phòng trọ
│   │   │   │   ├── room-create/    # Đăng bài (ROLE_LANDLORD)
│   │   │   │   └── room-manage/    # Quản lý bài đăng
│   │   │   └── services/
│   │   │       └── room.service.ts # Room API service
│   │   ├── social/          # Tìm người ở ghép (Repost)
│   │   ├── chat/            # Nhắn tin Realtime
│   │   ├── profile/         # Thông tin cá nhân
│   │   └── notification/    # Thông báo
│   │
│   ├── app.routes.ts        # Routing configuration
│   ├── app.config.ts        # App configuration
│   └── app.ts               # Root component
```

## 🚀 Các tính năng chính

### 1. Authentication & Authorization
- Đăng ký/Đăng nhập với JWT
- Phân quyền theo vai trò (ROLE_SEEKER/ROLE_LANDLORD)
- Guards bảo vệ routes

### 2. Quản lý bài đăng phòng trọ
- Xem danh sách phòng trọ
- Chi tiết phòng trọ
- Đăng tin (ROLE_LANDLORD)
- Tìm kiếm và lọc theo: tỉnh thành, giá, diện tích, tiện ích

### 3. Tìm người ở ghép (Social)
- Đăng bài tìm người ở ghép
- Comment và tương tác

### 4. Nhắn tin Realtime (Chat)
- Chat 1-1 với chủ nhà/người tìm phòng
- WebSocket/Firebase Realtime

### 5. Thông báo
- Thông báo tin nhắn mới
- Thông báo bài đăng được quan tâm

## 🛠 Công nghệ sử dụng

- **Angular 19** - Framework chính
- **TypeScript** - Ngôn ngữ lập trình
- **RxJS** - Reactive programming
- **Angular Router** - Routing
- **HttpClient** - HTTP requests
- **Firebase** - Authentication & Realtime Database
- **WebSocket** - Real-time messaging
- **SCSS** - Styling

## 📦 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm start

# Build production
npm run build
```

## 🔐 Environment Configuration

Cập nhật các file `environment.ts` và `environment.prod.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',  // URL Backend API
  wsUrl: 'ws://localhost:3000',         // WebSocket URL
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
```

## 📝 Coding Guidelines

### Component Structure
- Sử dụng **Standalone Components**
- Component nên nhỏ, tập trung vào một nhiệm vụ
- Tách logic phức tạp ra services

### Naming Conventions
- **Components**: `PascalCase` (e.g., `UserAvatarComponent`)
- **Services**: `PascalCase` với suffix `Service` (e.g., `AuthService`)
- **Files**: `kebab-case` (e.g., `user-avatar.component.ts`)

### State Management
- Sử dụng **RxJS BehaviorSubject** cho shared state
- Signal API cho reactive state (Angular 19+)

### HTTP Requests
- Luôn sử dụng `ApiService` làm wrapper
- Handle errors trong `ErrorInterceptor`
- Add authentication token trong `AuthInterceptor`

## 🎯 Workflow Development

1. **Tạo feature mới**: Tạo module trong `modules/`
2. **Tạo service**: Đặt trong `services/` của module hoặc `core/services/`
3. **Tạo model**: Đặt trong `data/schema/`
4. **Tạo shared component**: Đặt trong `shared/components/`
5. **Update routing**: Thêm route trong `app.routes.ts`

## 📚 Tài liệu tham khảo

- [Angular Documentation](https://angular.dev)
- [RxJS Documentation](https://rxjs.dev)
- [Firebase Documentation](https://firebase.google.com/docs)

---

**Phát triển bởi RoomMatch Team** 🏠
