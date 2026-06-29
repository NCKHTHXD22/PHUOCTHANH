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

router.use('/auth', authRoutes)
router.use('/public', publicFeedbackRoutes)

router.use(requireAuth)
router.use('/stats', statsRoutes)
router.use('/feedbacks', feedbackRoutes)
router.use('/users', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/zalo-members', zaloMembersRoutes)
router.use('/broadcast', broadcastRoutes)

module.exports = router
