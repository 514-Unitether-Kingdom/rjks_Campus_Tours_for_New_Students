// backend/middlewares/auth.js
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const C = require('../utils/constants');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.fail(C.AUTH_TOKEN_MISSING, '缺少认证token', null, 401);
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'user') {
      return res.fail(C.AUTH_TOKEN_INVALID, '无效或过期的token', null, 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.fail(C.USER_NOT_FOUND, '用户不存在', null, 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};