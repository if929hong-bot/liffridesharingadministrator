const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { rateLimit } = require('../middleware/rateLimit');

// 忘記密碼（限流）
router.post('/forgot-password', rateLimit, authController.forgotPassword);
// 驗證重置令牌
router.get('/reset-password/verify-token', authController.verifyResetToken);
// 提交新密碼
router.post('/reset-password/update', authController.resetPassword);

module.exports = router;