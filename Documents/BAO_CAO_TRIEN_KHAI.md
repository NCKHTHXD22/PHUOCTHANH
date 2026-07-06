# BÁO CÁO KẾT QUẢ TRIỂN KHAI
## Hệ thống Zalo OA – UBND xã Phước Thành

**Ngày báo cáo:** 03/07/2026
**Phạm vi:** 05 tính năng phục vụ người dân và công tác quản lý, điều hành trên nền tảng Zalo OA

---

> 📌 **Ghi chú khi hoàn thiện văn bản:**
> - Các vị trí đánh dấu `[Chèn ảnh: ...]` cần chụp màn hình thực tế trên điện thoại/máy tính và chèn vào đúng vị trí trước khi trình ký, ban hành chính thức.
> - Các đường liên kết đánh dấu `[ĐIỀN LINK ...]` cần thay bằng địa chỉ (URL) thực tế sau khi hoàn tất trỏ tên miền/triển khai chính thức trên Vercel và gắn vào Menu của Zalo OA.

---

## I. Bối cảnh và mục tiêu

Thực hiện chủ trương chuyển đổi số, đơn giản hoá thủ tục và tăng khả năng tiếp cận thông tin của người dân, UBND xã Phước Thành đã triển khai hệ thống Zalo Official Account (OA) tích hợp nhiều tiện ích công dân số. Đợt triển khai này bổ sung và hoàn thiện 05 tính năng trọng tâm:

1. Góp ý – Phản ánh
2. Gửi thông báo đến người dân
3. Tra cứu lịch cắt điện
4. Tra cứu lịch chi trả trợ cấp
5. Tra cứu văn bản hành chính

Mục tiêu chung: giúp người dân tiếp cận dịch vụ công và thông tin điều hành của xã ngay trên Zalo — nền tảng đã quen thuộc, không cần cài thêm ứng dụng — đồng thời giảm tải công việc thủ công cho cán bộ, công chức.

[Chèn ảnh: giao diện trang chủ / màn hình chat của Zalo OA UBND Phước Thành]

## II. Tổng quan kiến trúc giải pháp

Hệ thống gồm 3 lớp chính:

```
Người dân (Zalo)  ⇄  Zalo OA API
                         │
                    Backend (Node.js/Express, VPS)
                         │
        ┌────────────────┼────────────────┐
   MongoDB Atlas    Upstash Redis     Cloudinary
   (dữ liệu)      (token, cache)    (ảnh/video/file)
```

- **Backend**: xử lý webhook Zalo OA (tin nhắn, sự kiện theo dõi/rời nhóm...), cung cấp API cho các ứng dụng con, tự động hoá bằng các tác vụ định kỳ (cron): đồng bộ dữ liệu, gửi tin theo lịch, nhắc hạn xử lý.
- **04 mini-app độc lập** (giao diện web tối ưu cho điện thoại, mở trực tiếp từ Zalo): *Góp ý – Phản ánh*, *Tra cứu cắt điện*, *Tra cứu chi trả trợ cấp*, *Tra cứu văn bản hành chính*. Mỗi ứng dụng có giao diện, tốc độ tải và đường liên kết truy cập riêng.
- **Trang quản trị nội bộ** (dành cho cán bộ, công chức): xử lý phản ánh, gửi thông báo/broadcast, nhập liệu lịch chi trả trợ cấp, quản lý người theo dõi OA.

Toàn bộ 04 mini-app và trang quản trị dùng chung một ngôn ngữ thiết kế (gam màu tím – hồng, hiệu ứng chuyển động mềm mại) để tạo sự nhất quán về thương hiệu số của xã.

[Chèn ảnh: sơ đồ kiến trúc hệ thống]

## III. Kết quả triển khai theo từng tính năng

### 1. Góp ý – Phản ánh

**Mục tiêu:** cho phép người dân phản ánh các vấn đề tại địa phương (môi trường, hạ tầng, an ninh trật tự, dịch vụ công...) và theo dõi tiến độ xử lý minh bạch.

**Đã triển khai:**
- **Mini-app "Góp ý – Phản ánh"**: giao diện dạng biểu mẫu, đăng nhập bằng tài khoản Zalo (không cần mật khẩu riêng), có bản đồ hiển thị các phản ánh đang chờ xử lý trong khu vực xã, điền loại phản ánh (theo danh mục UBND cấu hình sẵn), số điện thoại liên hệ, nội dung, địa chỉ (tự động lấy vị trí GPS hoặc nhập tay), đính kèm tối đa 5 ảnh minh hoạ.
- **Tra cứu qua trò chuyện Zalo**: người dân nhắn **"#theodoigoopy"** (hoặc "theo dõi phản ánh") để xem lại các phản ánh đã gửi, hoặc nhắn thẳng mã phản ánh 5 ký tự (vd `#A1B2C`) để xem chi tiết ngay — không cần mở lại mini-app.

**Quy trình xử lý nội bộ:** phản ánh được lưu và có thể phân công cho cán bộ chuyên trách soạn dự thảo phản hồi, kèm khu vực trao đổi nội bộ giữa các cán bộ trước khi gửi; lãnh đạo duyệt và hệ thống tự gửi phản hồi cho người dân qua Zalo. Người dân xem được thanh tiến trình 5 bước (Đã gởi → Đã tiếp nhận → Đang xử lý → Đã duyệt → Đã xử lý) và cam kết phản hồi trong vòng 5 ngày làm việc.

[Chèn ảnh: giao diện mini-app Góp ý – Phản ánh (đăng nhập Zalo + biểu mẫu)]
[Chèn ảnh: bản đồ hiển thị phản ánh đang chờ xử lý trên mini-app]
[Chèn ảnh: kết quả tra cứu "#theodoigoopy" qua chat kèm thanh tiến trình]
[Chèn ảnh: màn hình quản lý/xử lý phản ánh dành cho cán bộ]

### 2. Gửi thông báo đến người dân

**Mục tiêu:** giúp UBND xã chủ động thông tin (thông báo họp, lịch thời vụ, cảnh báo thiên tai, tuyên truyền chính sách...) trực tiếp đến người dân đã theo dõi OA, không phụ thuộc loa truyền thanh hay niêm yết giấy.

**Đã triển khai** tại trang quản trị (mục "Gửi tin nhắn Zalo"), với 4 nhóm chức năng:
- **Gửi tin ngay**: soạn nội dung (tối đa 2000 ký tự) kèm hình ảnh (tối đa 5 ảnh, 10MB/ảnh), video (tối đa 100MB — chỉ gửi được cho nhóm) hoặc file (.docx/.pdf/.xlsx, tối đa 20MB); gửi tới người theo dõi (chọn từ danh sách hoặc nhập ID) hoặc tới các nhóm Zalo; theo dõi tiến độ gửi theo thời gian thực (số tin thành công/thất bại).
- **Quản lý người theo dõi & nhóm**: đồng bộ danh sách người theo dõi OA, quản lý danh sách nhóm Zalo nhận tin theo từng lĩnh vực.
- **Lịch sử gửi tin**: lưu lại toàn bộ các lượt gửi để tra soát khi cần.
- **Lên lịch gửi**: soạn trước và đặt thời điểm gửi tự động (ví dụ: thông báo phát vào 7h sáng hôm sau), có thể huỷ lịch trước giờ gửi.

Ngoài ra, trang quản trị còn có mục **"Cài đặt nhóm Zalo"** riêng để duyệt thành viên đăng ký vào từng nhóm theo danh mục quan tâm.

[Chèn ảnh: màn hình soạn và gửi thông báo]
[Chèn ảnh: màn hình lên lịch gửi tin]

### 3. Tra cứu lịch cắt điện

**Mục tiêu:** giúp người dân chủ động nắm lịch tạm ngừng cấp điện của ngành điện lực (EVNCPC) tại địa bàn, tránh bị động trong sinh hoạt, sản xuất.

**Đã triển khai:** mini-app **"Tra cứu lịch cắt điện"** — chọn một hoặc nhiều trạm biến áp, chọn ngày trên lịch (hoặc để trống để xem lịch sắp tới 14 ngày tới), kết quả hiển thị trực quan theo từng khung giờ.

Dữ liệu được hệ thống tự động đồng bộ định kỳ mỗi 30 phút từ nguồn dữ liệu công khai của EVNCPC, đúng đơn vị phụ trách địa bàn xã Phước Thành là **Điện lực Hiệp Đức** (mã đơn vị `PC05HH`), không cần cán bộ cập nhật thủ công.

[Chèn ảnh: giao diện chọn trạm và ngày trên mini-app Tra cứu lịch cắt điện]
[Chèn ảnh: kết quả tra cứu lịch cắt điện]

### 4. Tra cứu lịch chi trả trợ cấp

**Mục tiêu:** công khai minh bạch lịch chi trả trợ cấp xã hội (người có công, bảo trợ xã hội, hộ nghèo, trẻ em có hoàn cảnh đặc biệt...) để người dân/gia đình chủ động sắp xếp thời gian nhận.

**Đã triển khai:**
- **Mini-app "Lịch chi trả trợ cấp"**: người dân chọn tháng/năm cần tra cứu, xem thống kê nhanh (số đối tượng, tổng kinh phí, tỷ lệ chi trả qua tài khoản), lọc theo 4 nhóm đối tượng (Người có công với cách mạng, Bảo trợ xã hội hàng tháng, Hỗ trợ hộ nghèo & cận nghèo, Trợ cấp trẻ em & chính sách khác), xem chi tiết từng đợt chi trả (địa điểm, khung giờ, hình thức nhận — tiền mặt hoặc qua tài khoản, trạng thái Sắp diễn ra/Đang diễn ra/Hoàn thành).
- **Công cụ nhập liệu cho cán bộ** tại trang quản trị (mục "Lịch chi trả trợ cấp"): khai báo từng đợt chi trả theo tháng với đầy đủ thông tin nhóm đối tượng, số lượng người nhận, tổng kinh phí, địa điểm và cán bộ phụ trách.

[Chèn ảnh: giao diện mini-app Lịch chi trả trợ cấp]
[Chèn ảnh: màn hình nhập liệu lịch chi trả dành cho cán bộ]

### 5. Tra cứu văn bản hành chính

**Mục tiêu:** giúp người dân dễ dàng tìm kiếm văn bản quy phạm pháp luật, chính sách liên quan đến thành phố Đà Nẵng (địa bàn xã Phước Thành hiện thuộc) mà không phải tự tra cứu trên các cổng thông tin phức tạp.

**Đã triển khai:** mini-app "Tra cứu văn bản hành chính" cho phép tìm theo số hiệu văn bản, từ khoá trích yếu, khoảng ngày ban hành/ngày hiệu lực, lĩnh vực, loại văn bản và cơ quan ban hành; xem nhanh thống kê số văn bản mới nhất theo năm và tỷ lệ văn bản đã có hiệu lực. Nhấn vào kết quả sẽ mở văn bản gốc để xem/tải về.

Dữ liệu được hệ thống tự động thu thập hằng ngày (3 giờ sáng) từ cổng tra cứu văn bản công khai (1022.vn), chỉ giữ lại các văn bản liên quan đến thành phố Đà Nẵng để đảm bảo kết quả sát với nhu cầu thực tế của người dân địa phương.

[Chèn ảnh: giao diện mini-app Tra cứu văn bản hành chính]

### 6. Tiện ích khác đã có sẵn trên nền tảng dùng chung

Ngoài 05 tính năng trọng tâm nêu trên, OA còn kế thừa 2 tiện ích tra cứu qua trò chuyện Zalo từ nền tảng dùng chung, được giới thiệu ngay trong tin nhắn chào mừng khi người dân bắt đầu quan tâm OA:

- **Tra cứu hồ sơ hành chính** (nhắn **"#tracuuhoso"**): nhập mã hồ sơ (vd `H17.00-000000-0000`) để xem tiến độ xử lý hồ sơ tại Trung tâm hành chính công, kết nối qua hệ thống IOCTC. *Lưu ý: tính năng này cần UBND cung cấp tài khoản kết nối IOCTC (hiện chưa được cấu hình) mới hoạt động được — xem mục V.*
- **Tra cứu lịch cắt nước** (nhắn **"#lichcatnuoc"** hoặc "cắt nước"): nhập tên phường/xã hoặc ngày cần tra để xem lịch tạm ngưng cấp nước áp dụng chung toàn thành phố Đà Nẵng (nguồn DAWACO).

[Chèn ảnh: tin nhắn chào mừng khi quan tâm OA, giới thiệu các tiện ích trên]

## IV. Hạ tầng triển khai

| Thành phần | Giải pháp sử dụng |
|---|---|
| Máy chủ Backend | VPS Bitzfly, quản lý tiến trình bằng PM2, Nginx + SSL (Certbot) |
| Ứng dụng Frontend (04 mini-app + trang quản trị) | Vercel |
| Cơ sở dữ liệu | MongoDB Atlas (riêng cho xã Phước Thành) |
| Lưu token/cache | Upstash Redis |
| Lưu trữ ảnh/video/file | Cloudinary |
| Xác thực Zalo | OAuth theo chuẩn PKCE (bảo mật hơn OAuth truyền thống) |

Các tác vụ tự động (chạy định kỳ, không cần thao tác thủ công): đồng bộ lịch cắt điện (mỗi 30 phút), thu thập văn bản hành chính hằng ngày (3h sáng), gửi tin nhắn theo lịch, nhắc hạn xử lý phản ánh sắp/đã quá hạn (hạn 5 ngày làm việc), đồng bộ danh sách nhóm Zalo.

## V. Đánh giá và khuyến nghị tiếp theo

- Gắn đường liên kết chính thức của 04 mini-app vào Menu của Zalo OA để người dân truy cập thuận tiện ngay từ khung chat (xem mục Phụ lục).
- Đổi mật khẩu tài khoản quản trị mặc định ngay sau khi bàn giao quyền truy cập hệ thống.
- Cung cấp tài khoản kết nối hệ thống IOCTC (usename/mật khẩu tra cứu hồ sơ) để kích hoạt đầy đủ tính năng "Tra cứu hồ sơ hành chính" nêu tại mục III.6.
- Theo dõi vận hành thực tế trong 1–2 tuần đầu (tốc độ phản hồi, tỷ lệ gửi tin thành công, độ chính xác dữ liệu cắt điện/văn bản — đặc biệt kiểm tra lại danh sách trạm biến áp của Điện lực Hiệp Đức có khớp đúng địa bàn xã Phước Thành) trước khi truyền thông rộng rãi đến toàn thể người dân.
- Tuyên truyền, hướng dẫn người dân sử dụng qua loa truyền thanh, họp thôn, hoặc gửi thông báo giới thiệu qua chính tính năng "Gửi thông báo đến người dân".

## Phụ lục: Danh sách liên kết truy cập nhanh

| Tính năng | Đối tượng sử dụng | Cách truy cập |
|---|---|---|
| Góp ý – Phản ánh (mini-app) | Người dân | [ĐIỀN LINK MINI-APP GÓP Ý – PHẢN ÁNH] |
| Theo dõi phản ánh đã gửi (chat) | Người dân | Nhắn "#theodoigoopy" với OA UBND Phước Thành |
| Gửi thông báo đến người dân | Cán bộ, công chức | [ĐIỀN LINK TRANG QUẢN TRỊ] → mục "Gửi tin nhắn Zalo" |
| Tra cứu lịch cắt điện (mini-app) | Người dân | [ĐIỀN LINK MINI-APP TRA CỨU CẮT ĐIỆN] |
| Tra cứu lịch chi trả trợ cấp | Người dân | [ĐIỀN LINK MINI-APP CHI TRẢ TRỢ CẤP] |
| Nhập liệu lịch chi trả trợ cấp | Cán bộ, công chức | [ĐIỀN LINK TRANG QUẢN TRỊ] → mục "Lịch chi trả trợ cấp" |
| Tra cứu văn bản hành chính | Người dân | [ĐIỀN LINK MINI-APP VĂN BẢN HÀNH CHÍNH] |
| Tra cứu hồ sơ hành chính (chat) | Người dân | Nhắn "#tracuuhoso" với OA UBND Phước Thành |
| Tra cứu lịch cắt nước (chat) | Người dân | Nhắn "#lichcatnuoc" với OA UBND Phước Thành |

---

*Chi tiết các bước thao tác cụ thể của từng tính năng được trình bày trong tài liệu [Hướng dẫn sử dụng](HUONG_DAN_SU_DUNG.md).*
