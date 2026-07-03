const mongoose = require('mongoose');

// Văn bản pháp quy (nguồn: 1022.vn/vbpq) — chỉ lưu văn bản liên quan Đà Nẵng
const vanBanHanhChinhSchema = new mongoose.Schema({
  soHieu:         { type: String, default: '' },
  coQuanBanHanh:  { type: String, default: '' },
  loaiVanBan:     { type: String, default: '' },
  linhVuc:        { type: String, default: '' },
  trichYeu:       { type: String, default: '' },
  ngayBanHanh:    { type: Date, default: null },
  ngayHieuLuc:    { type: Date, default: null },
  detailUrl:      { type: String, required: true, unique: true },
  crawledAt:      { type: Date, default: Date.now },
});

vanBanHanhChinhSchema.index({ trichYeu: 'text', soHieu: 'text' });

module.exports = mongoose.model('VanBanHanhChinh', vanBanHanhChinhSchema);
