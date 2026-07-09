const { verifyToken } = require('../utils/jwt');
const Admin = require('../models/Admin');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.fail(1002, '缺少管理员认证token');
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'admin') {
      return res.fail(1003, '无效或过期的管理员token');
    }

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.fail(4001, '管理员不存在');
    }

    req.admin = admin; // 挂载管理员信息
    next();
  } catch (err) {
    next(err);
  }
};