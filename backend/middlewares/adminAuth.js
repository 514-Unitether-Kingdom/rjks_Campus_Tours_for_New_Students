// backend/middlewares/adminAuth.js
const { verifyToken } = require('../utils/jwt');
const Admin = require('../models/Admin');
const C = require('../utils/constants');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.fail(C.AUTH_TOKEN_MISSING, '缺少管理员认证token', null, 401);
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'admin') {
      return res.fail(C.AUTH_TOKEN_INVALID, '无效或过期的管理员token', null, 401);
    }

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.fail(C.ADMIN_NOT_FOUND, '管理员不存在', null, 401);
    }

    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
};