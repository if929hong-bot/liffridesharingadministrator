const { Sequelize } = require('sequelize');
require('dotenv').config();

// 創建數據庫連接（兼容Zeabur MySQL的SSL配置）
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // 關閉SQL日誌（開發時可改為console.log）
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false // 解決Zeabur MySQL的SSL驗證問題
      }
    }
  }
);

// 測試數據庫連接
async function testDbConnection() {
  try {
    await sequelize.authenticate();
    console.log('數據庫連接成功！');
  } catch (error) {
    console.error('數據庫連接失敗：', error);
  }
}

testDbConnection();

module.exports = sequelize;