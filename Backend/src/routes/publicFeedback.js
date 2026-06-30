const router = require('express').Router()
const axios = require('axios')
const multer = require('multer')
const CONFIG = require('../config')
const Category = require('../models/Category')
const Feedback = require('../models/Feedback')
const { uploadFromBuffer } = require('../utils/cloudinary')
const { createFeedbackEntry, isPhone, isEmail } = require('../services/feedbackService')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
})

// Đổi code OAuth (Đăng nhập bằng Zalo) lấy access_token cá nhân — code chỉ dùng được 1 lần
async function exchangeCodeForToken(code) {
  const tokenRes = await axios.post(
    'https://oauth.zaloapp.com/v4/access_token',
    new URLSearchParams({ code, app_id: CONFIG.ZALO_APP_ID, grant_type: 'authorization_code' }),
    { headers: { secret_key: CONFIG.ZALO_APP_SECRET, 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  const accessToken = tokenRes.data?.access_token
  if (!accessToken) throw new Error(`Đăng nhập Zalo thất bại: ${JSON.stringify(tokenRes.data)}`)
  return accessToken
}

// Lấy profile thật từ Zalo bằng access_token — verify server-side, không tin userId
// do client tự gửi (tránh giả mạo danh tính để bot gửi tin thay người khác)
async function fetchZaloProfile(accessToken) {
  const profileRes = await axios.get('https://graph.zalo.me/v2.0/me', {
    params: { fields: 'id,name,picture' },
    headers: { access_token: accessToken },
  })
  const { id, name, picture } = profileRes.data || {}
  if (!id) throw new Error(`Không lấy được thông tin Zalo: ${JSON.stringify(profileRes.data)}`)
  return { id: String(id), name: name || '', avatar: picture?.data?.url || '' }
}

// GET /api/public/categories — danh sách danh mục cho form chọn (ẩn zaloGroupId nội bộ)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({}, 'name icon order').sort({ order: 1 }).lean()
    res.json({ categories })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/public/zalo-login — đổi code lấy access_token + profile, hiện tên/avatar trước khi điền form
router.post('/zalo-login', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Thiếu code đăng nhập Zalo' })
    const accessToken = await exchangeCodeForToken(code)
    const profile = await fetchZaloProfile(accessToken)
    res.json({ accessToken, profile })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// POST /api/public/feedbacks — tạo phản ánh từ form web (multipart, tối đa 5 ảnh)
router.post('/feedbacks', upload.array('images', 5), async (req, res) => {
  try {
    const { accessToken, contact, categoryId, content, address, lat, lng } = req.body
    if (!accessToken) return res.status(400).json({ error: 'Thiếu thông tin đăng nhập Zalo' })
    if (!contact || (!isPhone(contact) && !isEmail(contact))) {
      return res.status(400).json({ error: 'SĐT hoặc email không hợp lệ' })
    }
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: 'Nội dung phản ánh quá ngắn (tối thiểu 5 ký tự)' })
    }

    const profile = await fetchZaloProfile(accessToken)

    let category = null
    if (categoryId) category = await Category.findById(categoryId).lean()

    const files = req.files || []
    const imageUrls = []
    for (const file of files) {
      const url = await uploadFromBuffer(file.buffer, `web-${Date.now()}-${imageUrls.length}`)
      imageUrls.push(url)
    }

    const location = {
      address: address?.trim() || '',
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    }

    const feedback = await createFeedbackEntry({
      userId: profile.id,
      displayName: profile.name,
      contact: contact.trim(),
      content: content.trim(),
      categoryId: category?._id || null,
      categoryName: category?.name || '',
      categoryGroupId: category?.zaloGroupId || null,
      imageUrls,
      location,
    })

    res.status(201).json({ ok: true, code: feedback._id.toString().slice(-5).toUpperCase() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/public/feedbacks/map — vị trí các phản ánh chưa hoàn tất (cho bản đồ trang login)
router.get('/feedbacks/map', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      status: { $nin: ['resolved', 'done'] },
      'location.lat': { $ne: null },
      'location.lng': { $ne: null },
    })
      .select('location content categoryId createdAt status')
      .populate('categoryId', 'name icon')
      .lean()

    const points = feedbacks.map(fb => ({
      lat: fb.location.lat,
      lng: fb.location.lng,
      address: fb.location.address || '',
      content: fb.content.slice(0, 80) + (fb.content.length > 80 ? '...' : ''),
      category: fb.categoryId ? `${fb.categoryId.icon || ''} ${fb.categoryId.name}`.trim() : 'Phản ánh',
      status: fb.status,
      createdAt: fb.createdAt,
    }))

    res.json({ points })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
