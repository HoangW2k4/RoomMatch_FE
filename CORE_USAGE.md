# Core Module - Hướng dẫn sử dụng

## Tổng quan

Thư mục `core` chứa các service, interceptor, guard cơ bản cho RoomMatch Frontend:

## Cấu trúc

```
core/
├── guards/
│   └── auth.guard.ts          # Authentication & Role-based guards
├── interceptors/
│   ├── jwt.interceptor.ts     # Tự động thêm JWT token vào header
│   └── error.interceptor.ts   # Xử lý lỗi toàn cục
├── models/
│   ├── enums.ts              # Enums (UserRole, PostStatus,...)
│   └── base.interface.ts      # Base interfaces
├── services/
│   ├── api.service.ts        # Wrapper cho HttpClient
│   └── auth.service.ts       # Authentication service
└── index.ts                   # Export tất cả
```

## API Service

Wrapper cho HttpClient, tự động nối `environment.apiUrl` vào mọi request.

### Sử dụng

```typescript
import { ApiService } from '@core';

export class RoomService {
  constructor(private api: ApiService) {}

  getRooms() {
    // GET http://localhost:8080/api/v1/rooms
    return this.api.get<Room[]>('/rooms');
  }

  getRoomById(id: string) {
    // GET http://localhost:8080/api/v1/rooms/:id
    return this.api.get<Room>(`/rooms/${id}`);
  }

  createRoom(data: CreateRoomDto) {
    // POST http://localhost:8080/api/v1/rooms
    return this.api.post<Room>('/rooms', data);
  }

  updateRoom(id: string, data: UpdateRoomDto) {
    // PUT http://localhost:8080/api/v1/rooms/:id
    return this.api.put<Room>(`/rooms/${id}`, data);
  }

  deleteRoom(id: string) {
    // DELETE http://localhost:8080/api/v1/rooms/:id
    return this.api.delete(`/rooms/${id}`);
  }
}
```

### Với query params và headers

```typescript
// GET /rooms?page=1&limit=10
this.api.get<Room[]>('/rooms', {
  params: { page: '1', limit: '10' }
});

// POST với custom headers
this.api.post<Room>('/rooms', roomData, {
  headers: { 'Content-Type': 'application/json' }
});
```

## Auth Service

Service xử lý authentication (login, register, logout).

### Sử dụng

```typescript
import { AuthService } from '@core';

export class LoginComponent {
  constructor(private authService: AuthService) {}

  onLogin() {
    this.authService.login({ 
      email: 'user@example.com', 
      password: 'password123' 
    }).subscribe({
      next: (response) => {
        console.log('Đăng nhập thành công', response);
        // Token tự động lưu vào localStorage
        // Redirect được xử lý bởi service
      },
      error: (error) => {
        console.error('Lỗi đăng nhập', error);
      }
    });
  }

  onRegister() {
    this.authService.register({
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'Nguyễn Văn A',
      phoneNumber: '0123456789',
      role: UserRole.ROLE_SEEKER
    }).subscribe({
      next: (response) => {
        console.log('Đăng ký thành công', response);
      }
    });
  }

  onLogout() {
    this.authService.logout();
  }
}
```

### Kiểm tra authentication

```typescript
// Kiểm tra đã đăng nhập chưa
if (this.authService.isAuthenticated) {
  console.log('User đã đăng nhập');
}

// Lấy thông tin user hiện tại
const currentUser = this.authService.currentUser;
console.log('Current user:', currentUser);

// Subscribe để nhận cập nhật user
this.authService.currentUser$.subscribe(user => {
  console.log('User changed:', user);
});

// Kiểm tra role
if (this.authService.hasRole(UserRole.ROLE_LANDLORD)) {
  console.log('User là chủ trọ');
}
```

## JWT Interceptor

Tự động thêm `Authorization: Bearer <token>` vào header của mọi HTTP request nếu có token trong localStorage.

**Không cần code gì thêm!** Đã được cấu hình trong `app.config.ts`.

```typescript
// Token tự động được thêm vào header
this.api.get('/protected-endpoint'); 
// -> Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Error Interceptor

Xử lý lỗi toàn cục:

- **401 Unauthorized**: Tự động logout và redirect về login
- **403 Forbidden**: Console error "Không có quyền truy cập"
- **404 Not Found**: Báo "Không tìm thấy tài nguyên"
- **500 Internal Server Error**: Báo "Lỗi server"

**Không cần code gì thêm!** Đã được cấu hình trong `app.config.ts`.

## Guards

### authGuard

Kiểm tra user đã đăng nhập chưa. Nếu chưa, redirect về `/auth/login`.

```typescript
// app.routes.ts
{
  path: 'profile',
  component: ProfileComponent,
  canActivate: [authGuard]
}
```

### Role Guards

Kiểm tra user có role phù hợp không:

```typescript
import { ROLE_LANDLORDGuard, ROLE_SEEKERGuard, ROLE_ADMINGuard } from '@core';

// Chỉ cho phép ROLE_LANDLORD
{
  path: 'room/create',
  component: CreateRoomComponent,
  canActivate: [authGuard, ROLE_LANDLORDGuard]
}

// Chỉ cho phép ROLE_SEEKER
{
  path: 'room/request',
  component: RequestRoomComponent,
  canActivate: [authGuard, ROLE_SEEKERGuard]
}

// Chỉ cho phép ROLE_ADMIN
{
  path: 'ROLE_ADMIN/dashboard',
  component: ROLE_ADMINDashboardComponent,
  canActivate: [authGuard, ROLE_ADMINGuard]
}
```

### Custom Role Guard

Tạo guard với nhiều role:

```typescript
import { roleGuard, UserRole } from '@core';

// Cho phép cả ROLE_LANDLORD và ROLE_ADMIN
export const ROLE_LANDLORDOrROLE_ADMINGuard = roleGuard(UserRole.ROLE_LANDLORD, UserRole.ROLE_ADMIN);
```

## Environment Configuration

### environment.ts (Development)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  // ...other configs
};
```

### environment.prod.ts (Production)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api/v1',
  // ...other configs
};
```

## Storage Structure

Sau khi login thành công, localStorage sẽ chứa:

```javascript
localStorage = {
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": "{\"id\":\"123\",\"email\":\"user@example.com\",\"role\":\"ROLE_SEEKER\",...}"
}
```

## Best Practices

1. **Luôn sử dụng ApiService** thay vì HttpClient trực tiếp
2. **Không hardcode baseUrl** - dùng environment.apiUrl
3. **Endpoint bắt đầu bằng /** - vd: `/rooms` không phải `rooms`
4. **Xử lý error trong component** - interceptor chỉ handle common errors
5. **Dùng guards cho protected routes** - đừng check auth trong component

## Ví dụ hoàn chỉnh

```typescript
import { Component } from '@angular/core';
import { ApiService, AuthService, UserRole } from '@core';

interface Room {
  id: string;
  title: string;
  price: number;
}

@Component({
  selector: 'app-room-list',
  template: `
    <div *ngIf="authService.isAuthenticated">
      <h1>Xin chào, {{ authService.currentUser?.fullName }}</h1>
      
      <button *ngIf="authService.hasRole(UserRole.ROLE_LANDLORD)"
              (click)="createRoom()">
        Đăng tin mới
      </button>

      <div *ngFor="let room of rooms">
        {{ room.title }} - {{ room.price | currency:'VND' }}
      </div>
    </div>
  `
})
export class RoomListComponent {
  rooms: Room[] = [];
  UserRole = UserRole;

  constructor(
    private api: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms() {
    this.api.get<Room[]>('/rooms').subscribe({
      next: (rooms) => {
        this.rooms = rooms;
      },
      error: (error) => {
        console.error('Lỗi tải danh sách phòng:', error);
      }
    });
  }

  createRoom() {
    // Navigate to create room page
  }
}
```
