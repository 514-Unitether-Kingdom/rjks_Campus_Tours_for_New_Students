const { verifyToken } = require('../utils/jwt');
const User = require('../models/User'); // 模型我们下一步写，先保存

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.fail(1002, '缺少认证token');

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'user') return res.fail(1003, '无效或过期的token');

    const user = await User.findById(decoded.userId);
    if (!user) return res.fail(4001, '用户不存在');

    req.user = user; // 把用户信息挂在req上，后续接口直接取
    next();
  } catch (err) {
    next(err);
  }
};