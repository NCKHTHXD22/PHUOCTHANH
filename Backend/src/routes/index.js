const router = require('express').Router()
const requireAuth = require('../middleware/requireAuth')
const authRoutes = require('./auth')
const statsRoutes = require('./stats')
const feedbackRoutes = require('./feedbacks')
const userRoutes = require('./users')
const categoryRoutes = require('./categories')
const zaloMembersRoutes = require('./zalo-members')
const broadcastRoutes = require('./broadcast')
const publicFeedbackRoutes = require('./publicFeedback')
const catDienRoutes = require('./cat-dien')
const vanBanHanhChinhRoutes = require('./van-ban-hanh-chinh')
const troCapPublicRoutes = require('./tro-cap-public')
const troCapRoutes = require('./tro-cap')

router.use('/auth', authRoutes)
router.use('/public', publicFeedbackRoutes)

// Công khai (không cần đăng nhập) — dữ liệu lịch cắt điện, văn bản hành chính, chi trả trợ cấp công cộng
router.use('/cat-dien', catDienRoutes)
router.use('/van-ban-hanh-chinh', vanBanHanhChinhRoutes)
router.use('/tro-cap-public', troCapPublicRoutes)

router.use(requireAuth)
router.use('/stats', statsRoutes)
router.use('/feedbacks', feedbackRoutes)
router.use('/users', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/tro-cap', troCapRoutes)
router.use('/zalo-members', zaloMembersRoutes)
router.use('/broadcast', broadcastRoutes)

module.exports = router
