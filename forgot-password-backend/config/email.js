const nodemailer = require('nodemailer');
require('dotenv').config();

// Gmail SMTP配置（已兼容Zeabur部署）
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  port: 465, // Gmail固定端口
  secure: true, // 強制SSL加密
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // 避免部署後的SSL驗證錯誤
  }
});

// 測試郵件服務連接
async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log('郵件服務配置成功！');
  } catch (error) {
    console.error('郵件服務配置失敗：', error);
  }
}

testEmailConnection();

// 發送密碼重置郵件
async function sendResetPasswordEmail(email, token) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '密碼重置通知',
    html: `
      <h3>親愛的用戶，您好！</h3>
      <p>您已申請重置密碼，請點擊下方連結設置新密碼（24小時內有效）：</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #165DFF; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0;">
        設置新密碼
      </a>
      <p>若您未申請忘記密碼，請忽略此郵件，您的帳號安全不會受影響。</p>
      <p>此致<br>您的平台團隊</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`重置郵件已發送至：${email}`);
    return true;
  } catch (error) {
    console.error('發送郵件失敗：', error);
    return false;
  }
}

module.exports = { sendResetPasswordEmail };