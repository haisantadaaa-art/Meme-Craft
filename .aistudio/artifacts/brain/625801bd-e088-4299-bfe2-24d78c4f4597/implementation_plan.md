# Kế Hoạch Triển Khai: Hệ Thống Tài Khoản, Google OAuth & Tự Tải Ảnh Đại Diện

## Tóm tắt các yêu cầu đã hoàn tất:
1. **Khôi phục hệ thống tài khoản & xác thực Firebase**:
   - `[Đăng nhập bằng Google]` qua `signInWithPopup(auth, googleProvider)`.
   - `[Chơi Ngay (Khách Vãng Lai / Guest)]` tự sinh mã ID ngẫu nhiên, lưu trữ Firebase RTDB & localStorage.
   - Tự động đồng bộ thông tin người chơi (`users/${uid}`) khi chuyển đổi phiên hoặc tải lại trang.
   - Nút `[Đăng Xuất]` xóa phiên đăng nhập và đưa người chơi về màn hình chọn tài khoản.
2. **Tính năng tự tải lên ảnh đại diện (Custom Avatar Upload)**:
   - `<input type="file" accept="image/*">` hỗ trợ tải ảnh từ máy tính hoặc điện thoại di động.
   - Sử dụng HTML5 Canvas center-crop và nén ảnh về kích thước chuẩn 128x128px định dạng JPEG (chất lượng 0.85, dung lượng ~5-12KB) giúp tối ưu hóa dung lượng truyền tải qua Realtime Database và tốc độ tải trang.
   - Lưới 12 avatar chibi đầu bếp/barista/thú cưng mặc định (`AVATAR_LIST`).
   - Component tái sử dụng `UserAvatar.jsx` hỗ trợ hiển thị liền mạch cả ảnh Base64/URL và ký tự emoji.
3. **Đồng bộ hiển thị Avatar trên toàn bộ hệ thống**:
   - Thanh Header (`Navbar.jsx`).
   - Danh sách bạn bè & Pop-up mời đấu/ghé thăm tiệm (`FriendsModal.jsx`).
   - Cửa sổ tin nhắn trò chuyện công cộng & tin nhắn riêng 1-1 (`ChatBox.jsx`, `FriendsModal.jsx`).
   - Phòng chờ minigame & hàng đợi ghép trận (`GameLobbyModal.jsx`, `ArcadeLobby.jsx`).
4. **Kiểm tra chất lượng**:
   - `compile_applet` & `lint_applet` đạt 0 lỗi.
   - Đã commit và push toàn bộ lên remote GitHub `main`.
