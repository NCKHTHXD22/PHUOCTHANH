const { sendZaloText, sendZaloToGroup } = require('../utils/zaloApi');
const Feedback = require('../models/Feedback');

function isPhone(text) {
  return /^(0|\+84)[3-9]\d{8}$/.test(text.replace(/\s/g, ''));
}

function isEmail(text) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
}

function isFeedbackTrigger(text) {
  const lower = text.toLowerCase();
  return (
    lower.includes('#goopy') ||
    lower.includes('góp ý') ||
    lower.includes('gop y') ||
    lower.includes('phản ánh') ||
    lower.includes('phan anh') ||
    lower === 'goopy'
  );
}

// Tạo phản ánh + báo nhóm Zalo + xác nhận cho người gửi — dùng chung cho form web
async function createFeedbackEntry({ userId, displayName, contact, content, categoryId, categoryName, categoryGroupId, imageUrls = [] }) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 3);

  const feedback = await Feedback.create({
    userId,
    displayName,
    contact,
    content,
    imageUrl: imageUrls[0] || '',
    imageUrls,
    categoryId: categoryId || null,
    deadline,
  });

  const shortCode = feedback._id.toString().slice(-5).toUpperCase();

  try {
    await sendZaloText(userId,
      '✅ Đã tiếp nhận phản ánh!\n\n' +
      `Mã phản ánh: #${shortCode}\n` +
      'UBND Phước Thành sẽ xử lý\n' +
      'trong 2-3 ngày làm việc kể từ\n' +
      'ngày tiếp nhận. Cảm ơn bạn!'
    );
  } catch (err) {
    console.warn('[Feedback] Không gửi được tin xác nhận Zalo:', err.message);
  }

  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const nameInfo = displayName ? `👤 Tên: ${displayName}\n` : '';
  const catInfo = categoryName ? `🏷️ Loại: ${categoryName}\n` : '';
  const imageInfo = imageUrls.length > 0
    ? `🖼️ ${imageUrls.length} ảnh:\n${imageUrls.map((u, i) => `  ${i + 1}. ${u}`).join('\n')}`
    : '🖼️ Ảnh: Không có';

  const groupMsg =
    `📩 PHẢN ÁNH MỚI - ${now}\n` +
    `${'─'.repeat(30)}\n` +
    `${nameInfo}` +
    `📞 Liên hệ: ${contact}\n` +
    `${catInfo}` +
    `📝 Nội dung:\n${content}\n` +
    `${imageInfo}\n` +
    `🆔 Mã: #${shortCode}`;

  await sendZaloToGroup(groupMsg, categoryGroupId);

  console.log(`[Feedback] Lưu góp ý userId=${userId} contact=${contact} category=${categoryName} images=${imageUrls.length}`);

  return feedback;
}

module.exports = { createFeedbackEntry, isPhone, isEmail, isFeedbackTrigger };
