const redis = require('redis');
const { promisify } = require('util');
require('dotenv').config();

// 創建Redis客戶端
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

// 限流：1小時內最多5次請求
exports.rateLimit = async (req, res, next) => {
  const key = `rate_limit:${req.ip}`;
  const limit = 5;
  const expire = 3600; // 秒

  try {
    const current = await getAsync(key);

    if (current) {
      if (parseInt(current) >= limit) {
        return res.status(429).json({
          success: false,
          message: '操作過於頻繁，請1小時後再試'
        });
      }
      await setAsync(key, parseInt(current) + 1);
    } else {
      await setAsync(key, 1, 'EX', expire);
    }
    next();
  } catch (error) {
    console.error('限流中間件錯誤：', error);
    next(); // Redis異常時跳過限流
  }
};