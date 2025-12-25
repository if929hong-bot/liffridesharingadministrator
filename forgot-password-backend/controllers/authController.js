const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { PasswordResetToken, Op } = require('../models/PasswordResetToken');
const { sendResetPasswordEmail } = require('../config/email');
require('dotenv').config();

// 1. 忘記密碼請求
exports.forgotPassword = async (req, res) => {
  try {
    const { username, email, phone } = req.body;

    // 驗證參數完整性
    if (!username || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: '請填寫完整的帳號、信箱和聯絡電話'
      });
    }

    // 查詢匹配的用戶
    const user = await User.findOne({
      where: { username, email, phone }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '帳號與信箱/電話不匹配，請核對後重試'
      });
    }

    // 生成重置令牌
    const token = uuidv4() + '-' + Math.random().toString(36).substr(2, 9);
    // 設置24小時過期
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 刪除用戶已有的未過期令牌
    await PasswordResetToken.destroy({
      where: { user_id: user.id, is_used: 0, expires_at: { [Op.gt]: new Date() } }
    });

    // 存儲新令牌
    await PasswordResetToken.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
      ip_address: req.ip
    });

    // 發送重置郵件
    const emailSent = await sendResetPasswordEmail(user.email, token);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: '郵件發送失敗，請稍後再試'
      });
    }

    res.status(200).json({
      success: true,
      message: '重置連結已發送至您的註冊信箱，24小時內有效'
    });

  } catch (error) {
    console.error('忘記密碼接口錯誤：', error);
    res.status(500).json({
      success: false,
      message: '服務器內部錯誤，請稍後再試'
    });
  }
};

// 2. 驗證重置令牌
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: '缺少重置令牌，請重新申請'
      });
    }

    // 查詢有效令牌
    const resetToken = await PasswordResetToken.findOne({
      where: { token, is_used: 0, expires_at: { [Op.gt]: new Date() } },
      include: [{ model: User, attributes: ['id', 'username'] }]
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: '重置連結已過期或無效，請重新申請忘記密碼'
      });
    }

    res.status(200).json({
      success: true,
      message: '令牌有效，請設置新密碼',
      userId: resetToken.user_id
    });

  } catch (error) {
    console.error('驗證令牌接口錯誤：', error);
    res.status(500).json({
      success: false,
      message: '服務器內部錯誤，請稍後再試'
    });
  }
};

// 3. 提交新密碼
exports.resetPassword = async (req, res) => {
  try {
    const { token, userId, newPassword, confirmPassword } = req.body;

    // 驗證參數
    if (!token || !userId || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '請填寫完整的參數'
      });
    }

    // 驗證密碼一致性
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '新密碼與確認密碼不一致，請核對後重試'
      });
    }

    // 驗證密碼強度（8-20位，含字母+數字）
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: '密碼需8-20位，包含字母和數字'
      });
    }

    // 驗證令牌有效性
    const resetToken = await PasswordResetToken.findOne({
      where: {
        token,
        user_id: userId,
        is_used: 0,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: '重置令牌無效或已過期，請重新申請'
      });
    }

    // 更新用戶密碼
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用戶不存在'
      });
    }

    user.password = newPassword;
    await user.save();

    // 標記令牌為已使用
    resetToken.is_used = 1;
    await resetToken.save();

    res.status(200).json({
      success: true,
      message: '密碼重置成功，請使用新密碼登錄'
    });

  } catch (error) {
    console.error('重置密碼接口錯誤：', error);
    res.status(500).json({
      success: false,
      message: '服務器內部錯誤，請稍後再試'
    });
  }
};