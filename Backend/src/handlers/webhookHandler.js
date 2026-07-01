const { sendZaloText } = require('../utils/zaloApi');
const { isFeedbackTrigger } = require('../services/feedbackService');
const { saveProfile } = require('../services/profileCache');
const { searchDossier, extractDossiers, sendDossierCard, isDossierCode } = require('../services/hoSoService');
const { sendWaterOutageCard } = require('../services/catNuocService');
const { addGroup } = require('../services/groupService');
const Feedback = require('../models/Feedback');
const CONFIG = require('../config');

// Trả về chuỗi tiến trình xử lý phản ánh
function buildProgressText(fb) {
  const step1 = true // luôn đã gởi
  const step2 = !!fb.assignedTo
  const step3 = !!fb.approvedBy || fb.status === 'resolved' || fb.status === 'done'
  const step4 = fb.status === 'resolved' || fb.status === 'done'

  const icon = (done) => done ? '✅' : '⏳'
  return (
    `${icon(step1)} Đã gởi hồ sơ\n` +
    `${icon(step2)} Đang xử lý\n` +
    `${icon(step3)} Đã duyệt\n` +
    `${icon(step4)} Hoàn tất`
  )
}

// Lưu trạng thái hội thoại theo userId (tự xóa sau 10 phút)
const userStates = new Map();
// Cache danh sách phản ánh khi user đang chọn
const userFeedbackCache = new Map();

const NUM_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

function feedbackStatusLabel(fb) {
  if (fb.status === 'done' || fb.status === 'resolved') return '✅ Đã xử lý xong';
  if (fb.status === 'draft') return '📋 Đang chờ duyệt';
  return '🕐 Đang xử lý';
}

function buildFeedbackListMsg(feedbacks) {
  let msg = '📋 Các phản ánh gần đây của bạn:\n';
  feedbacks.forEach((fb, i) => {
    const code = fb._id.toString().slice(-5).toUpperCase();
    const date = new Date(fb.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const preview = (fb.content || '').slice(0, 50);
    const ellipsis = fb.content?.length > 50 ? '...' : '';
    msg += `\n${NUM_EMOJI[i]} #${code} · ${date} · ${feedbackStatusLabel(fb)}\n   ${preview}${ellipsis}\n`;
  });
  msg += `\nNhấn số (1-${feedbacks.length}) để xem chi tiết, hoặc nhấn mã (#XXXXX).\n(Nhấn "huỷ" để thoát)`;
  return msg;
}

function buildFeedbackDetailMsg(fb) {
  const code = fb._id.toString().slice(-5).toUpperCase();
  const date = new Date(fb.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const catName = fb.categoryId?.name || 'Phản ánh';
  const addr = fb.location?.address || (fb.location?.lat ? `${fb.location.lat}, ${fb.location.lng}` : 'Không có');

  const icon = (d) => d ? '✅' : '⏳';
  const step1 = true;
  const step2 = !!fb.assignedTo;
  const step3 = ['processing', 'draft', 'resolved', 'done'].includes(fb.status);
  const step4 = !!fb.approvedBy || fb.status === 'resolved' || fb.status === 'done';
  const step5 = fb.status === 'done';

  let msg =
    `─── THÔNG TIN HỒ SƠ ───\n` +
    `🆔 Mã phản ánh: #${code}\n` +
    `📅 Ngày gửi: ${date}\n` +
    `🏷️ Loại: ${catName}\n` +
    `📍 Địa chỉ: ${addr}\n` +
    `📝 Nội dung: ${fb.content}\n\n` +
    `📊 TIẾN TRÌNH XỬ LÝ\n` +
    `${icon(step1)} 1. Đã gởi\n` +
    `${icon(step2)} 2. Đã tiếp nhận\n` +
    `${icon(step3)} 3. Đang xử lý\n` +
    `${icon(step4)} 4. Đã duyệt\n` +
    `${icon(step5)} 5. Đã xử lý`;

  const reply = fb.finalResponse || fb.response || '';
  if (reply) {
    msg += `\n\n─── PHẢN HỒI CỦA UBND ───\n${reply}`;
  }

  return msg;
}

function setState(userId, state) {
  userStates.set(userId, state);
  setTimeout(() => {
    if (userStates.get(userId) === state) userStates.delete(userId);
  }, 10 * 60 * 1000);
}

async function handleHoSoQuery(userId, code) {
  await sendZaloText(userId, `⏳ Đang tra cứu hồ sơ ${code}...`);
  try {
    const data = await searchDossier(code);
    const dossiers = extractDossiers(data);
    if (!dossiers.length) {
      await sendZaloText(userId,
        `❌ Không tìm thấy hồ sơ với mã: ${code}\n\nVui lòng kiểm tra lại mã hồ sơ hoặc liên hệ bộ phận tiếp nhận.`
      );
    } else {
      for (const d of dossiers) await sendDossierCard(userId, d);
    }
  } catch (err) {
    console.error('[IOCTC] Lỗi tra cứu:', err.message);
    await sendZaloText(userId, '⚠️ Hệ thống tra cứu tạm thời gián đoạn. Vui lòng thử lại sau ít phút.');
  }
}

async function handleWebhook(body) {
  const eventName = body.event_name;

  // Tự động lưu nhóm khi có thông tin group
  if (body.group?.id) {
    const groupId = String(body.group.id);
    const groupName = body.group.name || '';
    addGroup({ group_id: groupId, name: groupName })
      .then(() => console.log(`[Group] Auto-saved: ${groupId} "${groupName}"`))
      .catch(err => console.error('[Group] Auto-save error:', err.message));
  }

  if (eventName === 'oa_joined_group') {
    console.log(`[Group] OA được thêm vào nhóm: ${body.group?.id} "${body.group?.name}"`);
    return;
  }

  // Sự kiện vòng đời nhóm (GMF) → đồng bộ lại danh sách nhóm
  if (['create_group', 'delete_group'].includes(eventName)) {
    console.log(`[GroupSync] Webhook ${eventName} (group ${body.group?.id || body.group_id}) → lên lịch đồng bộ nhóm`);
    require('../services/groupSyncService').scheduleSyncDebounced();
    return;
  }

  // Sự kiện thành viên ra/vào nhóm
  if (['user_join_group', 'user_leave_group'].includes(eventName)) {
    const groupId = body.group?.id || body.group_id;
    const users = body.users || [];

    // Fallback nếu Zalo đổi lại cấu trúc
    if (!users.length) {
      const fallbackId = body.sender?.id || body.follower?.id || body.user?.id;
      if (fallbackId) users.push({ id: fallbackId });
    }

    console.log(`[GroupSync] Webhook ${eventName}: groupId=${groupId}, có ${users.length} user`);

    if (groupId && users.length > 0) {
      const { handleUserJoinGroup, handleUserLeaveGroup } = require('../services/groupSyncService');

      for (const u of users) {
        const userId = u.id;
        if (!userId) continue;

        if (eventName === 'user_join_group') {
          handleUserJoinGroup(groupId, userId, '', '').catch(e => console.error(e));
        } else {
          handleUserLeaveGroup(groupId, userId).catch(e => console.error(e));
        }
      }
    } else {
      console.warn(`[GroupSync] Webhook thiếu groupId hoặc danh sách user rỗng! Không thể xử lý.`);
    }
    return;
  }

  const userId = body.sender?.id || body.follower?.id;
  if (!userId) return;

  console.log(`[Event] ${eventName} | userId: ${userId}`);

  // Cache profile từ mọi sự kiện có sender info
  const displayName = body.sender?.display_name || body.follower?.display_name || '';
  const avatar = body.sender?.avatar || body.follower?.avatar || '';
  if (displayName) {
    saveProfile(userId, displayName, avatar).catch(() => {});
  }

  // Cập nhật profile khi user thay đổi tên/avatar
  if (eventName === 'update_user_info') {
    if (displayName) {
      console.log(`[Profile] Cập nhật thông tin: ${userId} → "${displayName}"`);
      // Cập nhật luôn vào danh sách followers trong Redis nếu có
      try {
        const { getStoredFollowers } = require('../services/followerService');
        const followers = await getStoredFollowers();
        const idx = followers.findIndex(f => f.user_id === userId);
        if (idx !== -1) {
          followers[idx].display_name = displayName;
          followers[idx].avatar = avatar;
          // Ghi lại vào Redis
          const axios = require('axios');
          const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
          const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
          if (redisUrl && redisToken) {
            await axios.post(redisUrl, ['SET', 'phuocthanh_oa_followers', JSON.stringify(followers)], {
              headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {
        console.warn('[Profile] Không cập nhật được followers list:', e.message);
      }
    }
    return;
  }

  // Chào mừng khi follow OA
  if (eventName === 'follow') {
    await sendZaloText(userId,
      'Xin chào! Chào mừng bạn quan tâm OA UBND Phước Thành 🏛️\n\n' +
      'Bạn có thể:\n' +
      '• 📝 Gửi góp ý, phản ánh — chọn mục "Góp ý - Phản ánh" trong menu\n' +
      '• 📋 Tra cứu hồ sơ hành chính — nhắn #tracuuhoso\n' +
      '• 💧 Xem lịch cắt nước — nhắn #lichcatnuoc'
    );
    return;
  }

  // Xử lý text và submit_info
  if (eventName === 'user_send_text' || eventName === 'user_submit_info') {
    let text;
    if (eventName === 'user_send_text') {
      text = (body.message?.text || '').trim();
    } else {
      text = (body.info?.action_payload || body.info?.data || body.info?.action || '').trim();
    }

    if (!text) return;

    const state = userStates.get(userId);
    const lower = text.toLowerCase();

    // Huỷ trạng thái
    if (['huỷ', 'huy', 'cancel', 'thoát', 'thoat'].includes(lower)) {
      userStates.delete(userId);
      userFeedbackCache.delete(userId);
      await sendZaloText(userId, 'Đã huỷ. Bạn có thể chọn lại từ menu bên dưới.');
      return;
    }

    // ── Lịch cắt nước ─────────────────────────────────────
    if (lower.includes('cắt nước') || lower.includes('catnuoc') || lower === '#lichcatnuoc') {
      setState(userId, 'waiting_for_catnuoc_filter');
      await sendZaloText(userId,
        '💧 Tra cứu lịch tạm ngưng cấp nước tại Đà Nẵng.\n\n' +
        'Nhập tên 📍 phường/xã hoặc 📅 ngày để tra cứu.\n' +
        'Ví dụ: Hòa Xuân  hoặc  20/05\n\n' +
        '(Nhắn "tất cả" để xem toàn bộ · Nhắn "huỷ" để thoát)'
      );
      return;
    }

    if (state === 'waiting_for_catnuoc_filter') {
      userStates.delete(userId);
      await sendZaloText(userId, '⏳ Đang tra cứu lịch cắt nước...');
      try {
        await sendWaterOutageCard(userId, text);
      } catch (err) {
        console.error('[CatNuoc] Lỗi:', err.message);
        await sendZaloText(userId, '⚠️ Không thể lấy lịch cắt nước. Vui lòng thử lại sau.');
      }
      return;
    }

    // ── Tra cứu hồ sơ ─────────────────────────────────────
    if (lower.includes('tra cứu') || lower.includes('tracuu') || lower === '#tracuuhoso' || lower.includes('hồ sơ')) {
      setState(userId, 'waiting_for_hoso_code');
      await sendZaloText(userId,
        '📋 Vui lòng nhập mã số hồ sơ cần tra cứu.\n' +
        'VD: H17.00-000000-0000\n\n' +
        '(Nhắn "huỷ" để thoát)'
      );
      return;
    }

    if (state === 'waiting_for_hoso_code') {
      if (isDossierCode(text)) {
        userStates.delete(userId);
        await handleHoSoQuery(userId, text.trim().toUpperCase());
      } else {
        await sendZaloText(userId,
          '❌ Mã hồ sơ không đúng định dạng.\n\n' +
          'Vui lòng nhập đúng định dạng:\nVD: H17.00-000000-0000\n\n' +
          '(Nhắn "huỷ" để thoát)'
        );
      }
      return;
    }

    // Gửi thẳng mã hồ sơ không qua trigger
    if (isDossierCode(text)) {
      await handleHoSoQuery(userId, text.trim().toUpperCase());
      return;
    }

    // ── Theo dõi phản ánh — xử lý khi đang chọn ──────────
    if (state === 'waiting_for_theodoi_select') {
      const cached = userFeedbackCache.get(userId) || [];
      let matched = null;

      const num = parseInt(lower.trim(), 10);
      if (num >= 1 && num <= cached.length) {
        matched = cached[num - 1];
      }

      if (!matched) {
        const codeInput = lower.replace('#', '').trim().toUpperCase();
        matched = cached.find(fb => fb._id.toString().slice(-5).toUpperCase() === codeInput);
      }

      if (matched) {
        userStates.delete(userId);
        userFeedbackCache.delete(userId);
        await sendZaloText(userId, buildFeedbackDetailMsg(matched));
      } else {
        await sendZaloText(userId,
          `❌ Không tìm thấy. Vui lòng nhập số từ 1-${cached.length} hoặc mã (#XXXXX).\n(Nhấn "huỷ" để thoát)`
        );
      }
      return;
    }

    // ── Theo dõi phản ánh (#theodoigoopy) ──────────────────
    if (lower === '#theodoigoopy' || lower.includes('theodoigoopy') || lower.includes('theo dõi phản ánh')) {
      try {
        // Gom mọi phản ánh của người này: khớp userId HOẶC cùng SĐT/email
        // (Zalo có thể cấp user_id khác nhau mỗi lần gửi qua Mini App)
        const byUser = await Feedback.find({ userId }, 'contact').lean();
        const contacts = [...new Set(byUser.map((f) => f.contact).filter(Boolean))];
        const query = contacts.length
          ? { $or: [{ userId }, { contact: { $in: contacts } }] }
          : { userId };
        const userFeedbacks = await Feedback.find(query)
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('categoryId', 'name')
          .lean();

        if (userFeedbacks.length === 0) {
          await sendZaloText(userId,
            '📋 Bạn chưa có phản ánh nào được gửi.\n\n' +
            'Chọn "Góp ý - Phản ánh" trong menu để gửi phản ánh mới.'
          );
          return;
        }

        userFeedbackCache.set(userId, userFeedbacks);
        setState(userId, 'waiting_for_theodoi_select');
        await sendZaloText(userId, buildFeedbackListMsg(userFeedbacks));
      } catch (err) {
        console.error('[TheodoiGoopy] Lỗi:', err.message);
        await sendZaloText(userId, '⚠️ Không thể tra cứu lúc này, vui lòng thử lại sau.');
      }
      return;
    }

    // ── Góp ý / phản ánh — hướng dẫn dùng form web (menu "Góp ý - Phản ánh") ──
    if (isFeedbackTrigger(lower) || lower === '#goopy') {
      await sendZaloText(userId,
        '📝 Để gửi góp ý / phản ánh, vui lòng chọn mục "Góp ý - Phản ánh" trong menu bên dưới.\n\n' +
        (CONFIG.REPORT_APP_URL ? `Hoặc bấm vào link: ${CONFIG.REPORT_APP_URL}` : '')
      );
      return;
    }

    return;
  }
}

module.exports = { handleWebhook };
