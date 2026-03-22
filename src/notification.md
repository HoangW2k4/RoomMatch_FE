# Hướng dẫn tích hợp Hệ thống Thông báo (Notification) cho Frontend

Tài liệu này mô tả chi tiết cách Frontend (Web/App) kết nối, tương tác và hiển thị thông báo thiết kế từ Backend (Spring Boot).

---

## 1. Cấu trúc dữ liệu Thông báo (Model)

Mỗi thông báo trả về từ API hoặc qua WebSocket đều có cấu trúc JSON như sau:

```json
{
  "id": "64f1b2c3e4b0a1d2e3f4g5h6",
  "recipientId": "user_id_nhan",
  "senderId": "user_id_gui",
  "referenceId": "id_cua_thuc_the_lien_quan",
  "type": "NEW_MESSAGE", 
  "title": "Tin nhắn mới từ User Name",
  "createdAt": "2023-09-01T12:30:45.123",
  "isRead": false,
  "isSeem": false,
  "metaData": {
    "senderName": "Tên người gửi (nếu có)",
    "senderAvatar": "URL avatar người gửi (nếu có)",
    "subReferenceId": "id_phu_ket_noi"
  }
}
```

### Các trạng thái của thông báo:
- **`isSeem`**: Đánh dấu thông báo đã được "nhìn thấy" (Tức là user đã mở danh sách thông báo lên xem). Khi FE gọi API lấy danh sách thông báo, BE sẽ tự động chuyển `isSeem = true`.
- **`isRead`**: Đánh dấu thông báo đã được "đọc" (Tức là user đã click thẳng vào thông báo đó để xem chi tiết). Cần gọi API riêng để cập nhật trạng thái này.

### Các loại thông báo (`NotificationType`):
- `NEW_MESSAGE`: Tin nhắn chat mới. (`referenceId` là `conversationId`).
- `NEW_COMMENT`: Bình luận bài viết mới. (`referenceId` là `targetId` của bài viết/repost, `metaData.subReferenceId` là id của comment/đối tượng con).
- `REPOST_CREATED`: Ai đó đã chia sẻ (repost) bài đăng của bạn. (`referenceId` là `postId`, `metaData.subReferenceId` là `repostId`).
- `SYSTEM`: Thông báo hệ thống (VD: Nâng cấp tài khoản thành công).

---

## 2. Các API Endpoints (HTTP)

Base URL: `/api/notifications`

### 2.1. Đăng ký Device Token (dành cho Firebase Push Notification)
Hệ thống sử dụng FCM để gửi Push Notification khi user không mở web/app. FE sau khi xin quyền và lấy FCM Token thành công cần gửi lên BE.

- **URL**: `POST /api/notifications/device-token`
- **Header**: Cần có token xác thực user (Bearer Token)
- **Body**:
  ```json
  {
    "token": "fcm_device_token_truyen_tu_frontend"
  }
  ```
- **Response**: `200 OK`

### 2.2. Lấy danh sách thông báo
Gọi API này để lấy danh sách thông báo hiển thị ở popup hoặc trang thông báo.
*(Lưu ý: Ngay sau khi gọi API này, các bài chưa `isSeem` sẽ được tự động đổi thành `isSeem = true`)*

- **URL**: `GET /api/notifications`
- **Params**:
  - `page`: Trang hiện tại (Mặc định: `0`)
  - `size`: Số lượng mỗi trang (Mặc định: `10`)
- **Header**: Xác thực user
- **Response**: Trả về `Page<Notification>` (đã được sort mới nhất lên đầu).

### 2.3. Lấy số lượng thông báo chưa xem
Thường dùng để hiển thị số (badge đỏ) ở icon cái chuông góc màn hình (`isSeem == false`).

- **URL**: `GET /api/notifications/unseem-count`
- **Header**: Xác thực user
- **Response**: 
  ```json
  {
    "status": 200,
    "message": "Success",
    "data": 5 // Số lượng chưa xem
  }
  ```

### 2.4. Đánh dấu một thông báo đã được đọc
Khi user click vào một thông báo cụ thể để xem thì gọi API này để update trạng thái `isRead = true`.

- **URL**: `PUT /api/notifications/{id}/read`
- **Path Variable**: `id` - ID của thông báo
- **Header**: Xác thực user
- **Response**: `200 OK`

---

## 3. Real-time qua WebSocket

Để có thể nhận thông báo ngay lập tức mà không cần F5 trình duyệt, FE cần kết nối tới Socket.

- **Topic cần Subscribe**: `/topic/notifications/{userId}`
  *(Chú ý truyền đúng ID của user đang đăng nhập thay vào `{userId}`)*
- **Data nhận được**: 
  Khi có sự kiện bắn về, payload nhận được là 1 JSON Object có cấu trúc chính xác giống như đối tượng `Notification` đã mô tả ở trên.
- **Xử lý FE**:
  Khi nhận được message từ Socket, FE có thể tự động cộng biến `unseem-count` lên 1, đồng thời popup 1 toast thông báo nhỏ nhỏ ở góc màn hình.

---

## 4. Push Notification (FCM / Firebase)

Bên cạnh WebSocket hoạt động khi user đang mở màn hình, tính năng Push Notification sẽ giúp gửi thông báo khi user đóng tab.

- FE cần tích hợp Firebase SDK, xin quyền `Notification` từ trình duyệt của người dùng.
- Payload nhận được từ FCM Push Message sẽ có dạng:
  - `notification.title`: Tiêu đề
  - `notification.body`: Nội dung
  - `data.referenceId`: Id tham chiếu
  - `data.click_action`: (Thường dùng cho mobile Flutter nếu có: `FLUTTER_NOTIFICATION_CLICK`)
- **Xử lý click (Web)**: Ở Service worker của FE, khi catch được event click lên notification, chuyển hướng người dùng tương ứng với `referenceId`.
