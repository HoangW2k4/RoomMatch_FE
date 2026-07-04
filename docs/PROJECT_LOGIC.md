# RoomMatch FE - Bản đồ logic dự án

Tài liệu này là điểm bắt đầu cho các lần tiếp tục phát triển RoomMatch FE. Nội dung mô tả kiến trúc hiện tại, chức năng nằm ở file nào, luồng dữ liệu chính, các thay đổi đã hoàn thiện và những contract BE cần lưu ý.

> Contract backend chi tiết nằm tại [`doc/API.md`](./API.md). Khi FE và tài liệu này khác nhau, ưu tiên kiểm tra lại `API.md` và mã nguồn backend.

## 1. Tổng quan kỹ thuật

- Framework: Angular 20, standalone components.
- REST API local: `http://localhost:8080/api`.
- WebSocket/STOMP local: `ws://localhost:8080/ws-pure`.
- Routing chính: `/home`, `/profile`, `/auth/login`.
- Access token lưu trong `localStorage.accessToken`.
- Refresh token lưu trong cookie `refreshToken`.
- Thông tin user hiện tại lưu trong `localStorage.user` và được đồng bộ reactive qua `AuthService.currentUser$`.
- API response phổ biến dùng `ApiResponse<T>`; phân trang dùng Spring `Page<T>`.
- Query `page` gửi lên backend bắt đầu từ `1`, trong khi `Page.number` trả về bắt đầu từ `0`.

### Các file khởi tạo

| Chức năng | File |
|---|---|
| Bootstrap Angular | `src/main.ts` |
| Router | `src/app/app.routes.ts` |
| HTTP interceptors, Firebase providers | `src/app/app.config.ts` |
| Root loading, alert, toast | `src/app/app.ts`, `src/app/app.html` |
| Biến môi trường API/WebSocket | `src/environments/environment.ts` |
| Layout chung | `src/app/layout/main-layout/main-layout.component.ts` |
| Navbar/header | `src/app/layout/navbar/navbar.component.ts` |
| Left sidebar | `src/app/modules/home/components/left-panel/left-panel.component.ts` |
| Right sidebar | `src/app/modules/home/components/right-panel/right-panel.component.ts` |

## 2. Core và lớp dùng chung

### REST và xử lý lỗi

| Chức năng | File | Ghi chú |
|---|---|---|
| Wrapper GET/POST/PUT/PATCH/DELETE | `src/app/core/services/api.service.ts` | Tự ghép `environment.apiUrl` với endpoint. |
| Gắn access token | `src/app/core/interceptors/jwt.interceptor.ts` | Bỏ qua `/refresh-access`. |
| Xử lý HTTP error và refresh 401 | `src/app/core/interceptors/error.interceptor.ts` | Gom các request chờ trong lúc refresh token. |
| Auth/role guards | `src/app/core/guards/auth.guard.ts` | Đã có nhưng hiện chưa gắn đầy đủ vào routes. |
| Kiểu response/phân trang | `src/app/core/models/base.interface.ts` | `ApiResponse`, `PaginatedResponse`. |
| Kiểu post/comment/repost | `src/app/core/models/post.interface.ts` | Cần giữ đồng bộ tên field với BE. |
| Enum role/status | `src/app/core/models/enums.ts` | Một số PostStatus hiện chưa khớp BE. |

### State user hiện tại

File: `src/app/core/services/auth.service.ts`

- `currentUser$` là observable dùng chung cho Header và LeftPanel.
- `updateCurrentUser()` merge user mới, chuẩn hóa `name/fullName` và `avatar/avatarUrl`, sau đó cập nhật cả `localStorage` lẫn observable.
- `currentUserId`, `hasRole()` đọc từ state dùng chung.
- Logout xóa access token, user, refresh cookie và phát `null` cho state.
- Mục tiêu: thay đổi avatar/tên/role phải lan tới các component đang mở mà không cần refresh trang.

### UI dùng chung

| Chức năng | File |
|---|---|
| Popup nền có header/body/footer | `src/app/shared/components/popup.ts` |
| Input tổng quát | `src/app/shared/components/input-field.component.ts` |
| Input text/password có validation | `src/app/shared/components/input-text.ts` |
| Dropdown đơn/đa lựa chọn | `src/app/shared/components/dropdown-field/dropdown-field.component.ts` |
| Media viewer | `src/app/shared/components/detail-list-medias/detail-list-medias.component.ts` |
| Loading toàn cục | `src/app/core/services/loading.service.ts`, `src/app/shared/module/spinner-loading.ts` |
| Alert | `src/app/core/services/alert.service.ts`, `src/app/shared/module/alert.ts` |
| Toast | `src/app/services/toast.service.ts`, `src/app/shared/components/toasts/toasts.component.ts` |

## 3. Authentication

### File liên quan

| Chức năng | File |
|---|---|
| Điều phối login/signup/forgot/OTP | `src/app/modules/auth/login/login.component.ts` |
| Gọi API auth | `src/app/modules/auth/login/login.service.ts` |
| Form đăng nhập | `src/app/modules/auth/login/sign-in/sign-in.component.ts` |
| Form đăng ký | `src/app/modules/auth/login/sign-up/sign-up.component.ts` |
| Quên mật khẩu | `src/app/modules/auth/login/forgot-password/forgot-password.component.ts` |
| Nhập OTP | `src/app/modules/auth/login/otp-verification/otp-verification.component.ts` |

### Luồng đăng nhập

1. Gọi `POST /auth/signin`.
2. `persistAuthSession()` kiểm tra response có đủ access/refresh token.
3. Lưu access token vào localStorage.
4. Lưu refresh token vào cookie.
5. Gọi `AuthService.updateCurrentUser()`.
6. Điều hướng về Home.

### Luồng đăng ký đã hoàn thiện

1. Gửi OTP qua `/auth/signup-otp`.
2. Xác nhận OTP và gọi `/auth/signup`.
3. Signup trả `JwtResponse` giống signin.
4. FE gọi chung `persistAuthSession()` trước khi điều hướng.
5. User được đăng nhập ngay, không còn bị 401 và báo “phiên đăng nhập hết hạn” sau signup.

### Lưu ý auth/BE

- BE hiện có lỗ hổng cho phép signup admin nếu client gửi `role=ADMIN/ROLE_ADMIN`; phải sửa ở BE trước khi deploy.
- Theo `API.md`, reset password yêu cầu field `newPassword`; cần kiểm tra lại `login.service.ts` nếu vẫn gửi `password`.
- API auth trả token trực tiếp; không điều hướng vào màn hình có API bảo vệ trước khi lưu token.

## 4. Home feed và tìm kiếm

### File liên quan

| Chức năng | File |
|---|---|
| Điều phối feed, filter, infinite scroll | `src/app/modules/home/home.component.ts` |
| Template feed | `src/app/modules/home/home.component.html` |
| Tất cả API post/comment/repost | `src/app/modules/home/post.service.ts` |
| Thanh tìm kiếm | `src/app/modules/home/components/search-filter/search-filter.component.ts` |
| Popup filter | `src/app/modules/home/components/search-filter/filter-popup/filter-popup.component.ts` |
| Card bài đăng | `src/app/modules/home/components/post-card/post-card.component.ts` |
| Chi tiết bài | `src/app/modules/home/components/post-detail/post-detail.component.ts` |
| Comment/reply | `src/app/modules/home/components/post-card/comment-section/comment-section.component.ts` |
| Gallery 1-5 media | `src/app/modules/home/components/post-card/layouts/gallery-layout-*.component.ts` |

### Feed

- `HomeComponent.loadPosts()` gọi `PostService.searchPosts()`.
- Infinite scroll dùng `IntersectionObserver` ở sentinel cuối danh sách.
- Khi đổi filter: reset `currentPage=1`, xóa posts cũ rồi tải lại.
- Like dùng optimistic update: đổi icon/count trước, rollback nếu API lỗi.
- Click card mở `PostDetailComponent` bằng `selectedPostId` và `isPostDetailVisible`.

### Video feed và popup chi tiết

File chính: `post-card.component.ts`.

- Video trong card tự chạy khi card giao ít nhất 30% viewport.
- Nhiều video trong một card được chạy tuần tự.
- Input `playbackPaused` khóa toàn bộ phát video nền.
- Home và Profile truyền `[playbackPaused]="isPostDetailVisible"`.
- Khi mở chi tiết: video feed dừng và không được IntersectionObserver phát lại.
- Khi đóng chi tiết: chỉ card còn trong viewport được phát lại.

### Filter

- Filter vị trí: province → district → ward.
- Filter giá, diện tích, tuổi/giới tính roommate được quản lý trong `filter-popup.component.ts`.
- Keyword ở thanh tìm kiếm debounce 500 ms.
- BE hỗ trợ `amenityNames`, nhưng cần kiểm tra `PostService.searchPosts()` vì hiện có thể chưa gửi danh sách tiện ích.

## 5. Tạo bài đăng

### File liên quan

| Chức năng | File |
|---|---|
| Logic form, upload, tạo request | `src/app/modules/home/components/add-post-popup/add-post-popup.component.ts` |
| Template | `src/app/modules/home/components/add-post-popup/add-post-popup.component.html` |
| Layout/scroll | `src/app/modules/home/components/add-post-popup/add-post-popup.component.css` |
| API create post | `src/app/modules/home/post.service.ts` |
| Input số/tiền | `src/app/shared/components/input-field.component.ts` |

### Request tạo bài

- Gửi multipart/form-data.
- Part `data` là JSON Blob `application/json`.
- Part `files` chứa ảnh/video.
- `addressRequest.detail` chứa địa chỉ cụ thể.
- Amenities gửi `{name, iconUrl}`.

### Format tiền VND đã hoàn thiện

- Mọi input `type="currency"` format ngay trong lúc gõ.
- Ví dụ hiển thị `3.500.000 ₫`, nhưng FormControl giữ chuỗi số thô `3500000` để gửi BE.
- Giá thuê, tiền cọc và min/max price trong filter đều dùng separator Việt Nam.
- Logic nền nằm trong `InputFieldComponent.onInput()`.

### Scroll tiện ích đã sửa

- `.add-post-container` dùng `height/max-height: 100%` theo vùng body flex của popup.
- Không còn dùng phép tính `90vh - 110px` bị sai do thiếu header/footer/padding.
- Có `padding-bottom` để hàng tiện ích cuối không bị footer che.

### Cập nhật danh sách sau khi đăng bài

File: `profile.component.ts` và `profile.component.html`.

- Popup phát event `postCreated` sau khi API thành công.
- `ProfileComponent.onPostCreated()` đóng popup, chuyển về tab `my-posts`, reset page/posts và tải lại page 1.
- Bài mới xuất hiện đầu danh sách theo thứ tự BE mà không cần reload trình duyệt.

## 6. Profile và cập nhật avatar

### File liên quan

| Chức năng | File |
|---|---|
| Điều phối profile/tab/post | `src/app/modules/profile/profile.component.ts` |
| Template profile | `src/app/modules/profile/profile.component.html` |
| API account | `src/app/modules/profile/profile.service.ts` |
| Popup sửa profile/avatar | `src/app/modules/profile/edit-profile-popup/edit-profile-popup.component.ts` |

### Profile của mình/người khác

- Không có `userId` query: profile của user hiện tại.
- Có `?userId=...`: profile người khác.
- Tab phụ thuộc role và quyền sở hữu profile.
- Landlord: bài đăng; seeker: repost/liked.
- Một số tab repost hiện vẫn là placeholder dù service đã có API.

### Đồng bộ avatar đã hoàn thiện

1. Update account thành công phát `profileUpdated`.
2. Profile gọi lại `/account/info` vì `/account/change-info` trả `data: null`.
3. Nếu là profile của chính mình, gọi `AuthService.updateCurrentUser()`.
4. Header và LeftPanel subscribe `currentUser$` nên đổi avatar ngay.
5. User mới được ghi lại vào localStorage.

### Avatar mặc định

- LeftPanel hỗ trợ cả field `avatar` và `avatarUrl`.
- Nếu URL rỗng dùng `assets/images/avatar_default.jpg`.
- Nếu tải ảnh lỗi, `(error)` chuyển về ảnh mặc định.
- BE có thể trả chuỗi `avatar_default.jpg`; đây không phải URL asset Angular hợp lệ nếu không có prefix.

### Lỗi BE khi chỉ đổi avatar

BE từng trả:

```text
Cannot invoke String.isEmpty() because UpdateInfo.getEmail() is null
```

Nguyên nhân: FE chỉ gửi field thay đổi, còn BE gọi `getEmail().isEmpty()` không null-check. Cách sửa bền vững nằm ở BE (`StringUtils.hasText` hoặc null-check). Nếu chưa sửa BE, FE phải gửi đủ email hiện tại cùng avatar.

## 7. Header và LeftPanel

| Chức năng | File |
|---|---|
| Header, notification/chat menu, nút đăng bài | `src/app/layout/navbar/navbar.component.ts` |
| Header template | `src/app/layout/navbar/navbar.component.html` |
| Left user/nav | `src/app/modules/home/components/left-panel/left-panel.component.ts` |
| Left template | `src/app/modules/home/components/left-panel/left-panel.component.html` |

- Cả hai subscribe `AuthService.currentUser$` để avatar/tên/role cập nhật realtime.
- LeftPanel chỉ render user khi authenticated.
- Cả left panel bị ẩn dưới breakpoint `xl` bởi `d-none d-xl-flex`.
- Link `/settings` và `/room/manage` chưa có route thực; wildcard hiện đưa về Home.

## 8. Comment, like, repost

### Like

- API toggle: `GET /post/like?postId=...`.
- Home/Profile/PostDetail đều cập nhật optimistic và rollback khi lỗi.
- Đây là GET làm thay đổi dữ liệu; không được prefetch/cache.

### Comment

- Load: `/post/comments`.
- Create comment/reply: `/post/comment`, reply dùng `parentId`.
- Delete: `/post/delete-comment`.
- UI hỗ trợ cây comment, collapse/expand, reply và phân trang hiển thị phía client.
- BE trả boolean `deleted`; kiểm tra model FE nếu vẫn dùng `isDeleted`.

### Repost

- Service đã có create/get/delete/search repost trong `post.service.ts`.
- Profile UI cho repost chưa hoàn thiện đầy đủ.

## 9. Chat realtime

### File liên quan

| Chức năng | File |
|---|---|
| DTO chat | `src/app/modules/chat/chat.interface.ts` |
| REST conversation/messages/media | `src/app/modules/chat/chat.service.ts` |
| STOMP connect/send/subscribe/reconnect | `src/app/services/websocket.service.ts` |
| State yêu cầu mở chat | `src/app/services/chat-ui.service.ts` |
| Popup chat | `src/app/shared/components/chat-popup/chat-popup.component.ts` |

### Luồng

- REST tải conversation và message history.
- Text/POST_SHARE gửi qua STOMP `/app/chat.send`.
- Media gửi multipart qua `/chat/send-media`.
- Conversation tạm được tạo ở FE khi nhắn user chưa có conversation.
- Sau lần gửi đầu, FE retry lấy conversation ID tối đa 6 lần.
- Tin nhắn gửi được optimistic append vào UI.
- Khi chat đang mở, FE gọi mark-read.

### Contract cần kiểm tra

- `API.md` ghi subscribe nhận chat tại `/user/queue/messages`.
- `WebsocketService` từng dùng destination có user ID; cần giữ đúng cấu hình backend đang chạy.

## 10. Notification

### File liên quan

| Chức năng | File |
|---|---|
| Model | `src/app/models/notification.model.ts` |
| API, unread count, realtime toast | `src/app/services/notification.service.ts` |
| Header notification panel | `src/app/layout/navbar/navbar.component.ts` |
| Right panel | `src/app/modules/home/components/right-panel/right-panel.component.ts` |

- List API tự đánh dấu `seem=true`; chỉ gọi khi thực sự hiển thị notification.
- `unseem-count` là tên endpoint thật của BE.
- Realtime notification tăng counter, phát event và hiện toast.
- NEW_MESSAGE không tăng notification counter thường vì chat có unread riêng.

## 11. Contract BE đang lệch hoặc cần theo dõi

1. Signup không được tin field `role`; BE phải chặn tạo admin từ request client.
2. Reset password: BE dùng `newPassword`, FE cần tránh gửi `password`.
3. Post detail: BE trả `likedByCurrentUser`; model FE từng dùng `isLikedByCurrentUser`.
4. Comment: BE trả `deleted`; model FE từng dùng `isDeleted`.
5. Amenity BE dùng `{name, iconUrl}`; một số interface FE dùng `{code, name, icon}`.
6. PostStatus BE: `ACTIVE`, `HIDDEN`, `EXPIRED`, `FILLED`; enum FE chưa đồng nhất.
7. `/account/change-info` trả `data: null`; không chờ response data để cập nhật user.
8. Location, post detail và comments hiện yêu cầu access token theo cấu hình BE.
9. Location geocoding BE đang hard-code nên `addressUrl` có thể sai.
10. Một số BE GET (`like`, `chat/mark-read`) làm thay đổi dữ liệu.

## 12. Trạng thái kiểm thử/build

- Lệnh build trên Windows: `npm.cmd run build`.
- Build hiện thành công.
- Cảnh báo hiện có:
  - Initial bundle vượt warning budget khoảng 92 KB.
  - CSS PostDetail và CommentSection vượt component style warning budget.
  - `@stomp/stompjs` bị Angular nhận diện CommonJS.
- Project hiện chưa có coverage unit test đáng kể; các luồng UI quan trọng vẫn cần test trình duyệt.

## 13. Checklist khi phát triển tiếp

1. Đọc file này và `doc/API.md` trước khi sửa contract FE-BE.
2. Với user/avatar/name/role, cập nhật qua `AuthService.updateCurrentUser()`, không chỉ ghi localStorage.
3. Với popup tạo/sửa dữ liệu, phát event thành công về component cha để refresh đúng danh sách.
4. Với video/modal, kiểm tra media nền đã pause trước khi autoplay media trong popup.
5. Input tiền phải dùng `type="currency"`, separator `.` và decimal `0` cho VND.
6. Khi thêm vùng scroll trong popup, dùng chiều cao flex khả dụng, tránh tự trừ `vh` bằng số cố định.
7. Chạy `npm.cmd run build` sau mọi thay đổi TypeScript/template.
8. Không sửa hoặc xóa thay đổi hiện có ngoài phạm vi tác vụ.

