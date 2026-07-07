const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const secret = process.env.JWT_SECRET;

// 给普通用户签发 token
exports.signUserToken = (userId) => {
  return jwt.sign({ userId, type: 'user' }, secret, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// 给管理员签发 token
exports.signAdminToken = (adminId) => {
  return jwt.sign({ adminId, type: 'admin' }, secret, { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN });
};

// 验证 token
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (e) {
    return null;
  }
};