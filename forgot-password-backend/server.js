const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

// 創建Express實例
const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors()); // 解決跨域
app.use(express.json()); // 解析JSON請求體

// 健康檢查接口（Zeabur部署必需）
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 註冊路由
app.use('/api', authRoutes);

// 同步數據庫模型（開發環境用，生產環境建議手動同步）
sequelize.sync({ alter: true })
  .then(() => console.log('數據庫模型同步成功'))
  .catch(err => console.error('數據庫模型同步失敗：', err));

// 啟動服務
app.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
});