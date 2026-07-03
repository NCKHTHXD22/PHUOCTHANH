const mongoose = require('mongoose');

// Lịch chi trả trợ cấp xã hội / người có công — nhập tay từ thông báo của UBND
// (nguồn không có API/feed công khai, dữ liệu thường nằm trong file PDF đính kèm bài tin)
const troCapScheduleSchema = new mongoose.Schema({
  phuongCu:     { type: String, default: '' },   // đơn vị cũ trước sáp nhập (nếu có)
  phuongMoi:    { type: String, required: true }, // đơn vị mới / hiện tại
  ngayChiTra:   { type: Date, required: true },   // ngày chi trả — dùng để lọc theo tháng/năm
  khungGio:     { type: String, default: '' },    // vd "Buổi chiều: 13h30 - 17h00"
  diaDiem:      { type: String, required: true },
  nhanVienTen:  { type: String, default: '' },
  nhanVienSdt:  { type: String, default: '' },
  ghiChu:       { type: String, default: '' },
  // Phân loại nhóm đối tượng — dùng để lọc theo chip trên mini app
  loaiTroCap:   { type: String, enum: ['cong', 'baotro', 'ngheo', 'treem'], default: 'baotro' },
  soLuong:      { type: Number, default: 0 },     // số người/hộ nhận trợ cấp
  donVi:        { type: String, default: 'người' }, // đơn vị tính: người / hộ / trẻ
  soTien:       { type: Number, default: 0 },     // tổng kinh phí chi trả (đồng)
  hinhThuc:     { type: String, enum: ['bank', 'cash'], default: 'cash' }, // qua tài khoản / tiền mặt
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: null },
});

troCapScheduleSchema.index({ ngayChiTra: 1 });

module.exports = mongoose.model('TroCapSchedule', troCapScheduleSchema);
