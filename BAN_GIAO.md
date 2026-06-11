# BÀN GIAO — Dự án OA Zalo Xã Phước Thành

> File này tóm tắt toàn bộ ngữ cảnh để tiếp tục làm việc trên dự án Phước Thành.
> Clone từ dự án Quế Sơn (`d:\QUESON`) ngày 2026-06-11.

## 1. Dự án là gì
Hệ thống Zalo OA cho UBND Xã Phước Thành, kiến trúc y hệt Quế Sơn:
- **Backend** Node/Express: webhook Zalo + REST API (`/api`) + admin EJS (`/admin`).
- **Frontend** React tại `Web/` (Vite + Tailwind).
- **Dữ liệu**: MongoDB + Redis (Upstash) + Cloudinary.
- **3 tính năng chính** trong chatbot:
  - 📝 Góp ý / phản ánh (`#goopy`) — state machine 5 bước, lưu Mongo, đẩy vào nhóm Zalo theo danh mục.
  - 📋 Tra cứu hồ sơ TTHC (`#tracuuhoso`) — gọi API IOCTC `tctthc.1022.vn`, render ảnh card.
  - 💧 Lịch cắt nước (`#lichcatnuoc`) — qua proxy DAWACO Đà Nẵng.
  - ➕ Gửi tin broadcast + lên lịch (scheduler cron mỗi phút).

## 2. Đã làm khi clone (xong)
- Đổi branding Quế Sơn → Phước Thành (23 file).
- Đổi tiền tố Redis `queson_*` → `phuocthanh_*` (cách ly dữ liệu khỏi Quế Sơn).
- Sửa `setup-menu.js` + `update-webhook.js` (bỏ tàn dư "Vũ Gia" của bản gốc tổ tiên).
- Tạo `.env`: secret mới, `PORT=3002` (chạy song song Quế Sơn 3001), phần Zalo để trống.
- Verify: syntax backend `.js` = 0 lỗi; `.gitignore` chặn `.env`; ghi thử MongoDB OK.

## 3. Quyết định hạ tầng (đã chốt)
- **MongoDB: RIÊNG** cho Phước Thành (người dùng tự tạo — KHÁC với dự định "dùng chung" ban đầu).
- **Redis / Cloudinary / IOCTC / DAWACO: dùng chung** với Quế Sơn (Redis tách bằng tiền tố key).

## 4. ĐANG CHỜ — việc tiếp theo cần làm
### Điền vào `.env` (hiện đang trống):
1. `MONGO_URI` — chuỗi kết nối Mongo RIÊNG của Phước Thành *(người dùng đã tạo, chưa dán vào)*.
   - Nếu vào mạng qua hotspot/VNPT mà lỗi `querySrv ECONNREFUSED` → đổi `mongodb+srv://` sang dạng không-SRV (liệt kê shard `:27017`).
2. `ZALO_APP_ID`, `ZALO_APP_SECRET` — từ https://developers.zalo.me (app gắn với OA Phước Thành).
3. `ZALO_OA_TOKEN`, `ZALO_REFRESH_TOKEN` — lấy qua OAuth:
   - Cấp quyền OA → nhận `code` → trang `/` của server tự đổi `code` ra token (xem `server.js`), HOẶC dán thủ công tại `/admin/set-tokens`.
4. `ZALO_GROUP_ID` + `zaloGroupId` cho từng danh mục — tạo nhóm Zalo, lấy group_id *(làm sau, không chặn chạy thử)*.
5. `PUBLIC_URL` — điền sau khi deploy backend (Render).

### Sau khi có token:
- Đặt **Webhook URL** trên Zalo Developer = `<backend-url>/webhook`.
- Chạy `node setup-menu.js` để cài menu OA. *(Còn 2 link cần sửa — đánh dấu `TODO` trong file: website xã Phước Thành + link tra cứu ngắt điện.)*
- Đăng nhập admin → tạo 4 danh mục phản ánh + tài khoản cán bộ.

## 5. Lỗi đã biết (kế thừa từ Quế Sơn)
- **Tra cứu hồ sơ (nhiệm vụ #5)**: API IOCTC `tctthc.1022.vn/tra-cuu` trả **HTTP 500 "Giai CAPTCHA loi: cannot identify image file"** — lỗi phía server IOCTC (module giải CAPTCHA của họ hỏng), **không phải code**. Code đã đúng, chờ IOCTC sửa. Token + các endpoint khác vẫn chạy.
- **Lịch cắt nước (nhiệm vụ #1)**: nguồn DAWACO **chỉ có dữ liệu Đà Nẵng, KHÔNG có Phước Thành/Quế Sơn** (DAWACO không cấp nước khu vực này). Muốn "chỉ lọc Phước Thành" phải **xin API/nguồn nước riêng** của địa phương. Đang chờ API.

## 6. Chạy local
```powershell
cd d:\PHUOCTHANH
npm install               # deps backend
npm install --prefix Web  # deps frontend
npm run dev               # backend, cổng 3002
# terminal khác:
cd d:\PHUOCTHANH\Web; npm run dev   # frontend, cổng 5173
```
- Admin mặc định (seed tự động): **admin / admin@2025**.
- Dừng server: `Ctrl + C`. Nếu lỗi `EADDRINUSE`: có tiến trình node cũ giữ cổng → `Get-Process node | Stop-Process -Force`.

## 7. Cấu trúc thư mục nhanh
- `server.js` — entrypoint, mọi route gắn ở đây.
- `src/handlers/webhookHandler.js` — định tuyến sự kiện Zalo (trái tim chatbot).
- `src/services/` — feedback, hoSo (tra cứu hồ sơ), catNuoc (cắt nước), broadcast, scheduler, follower, group, profileCache.
- `src/routes/` — REST API cho React; `src/models/` — Mongo schemas.
- `Web/src/` — frontend React (pages, components, contexts).
