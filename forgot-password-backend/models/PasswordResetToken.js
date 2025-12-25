const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_used: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'password_reset_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // 不需要更新時間
});

// 關聯用戶模型
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { PasswordResetToken, Op };