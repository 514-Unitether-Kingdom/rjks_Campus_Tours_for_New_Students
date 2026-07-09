const Badge = require('../models/Badge');
const dto = require('../utils/dto');

// GET /api/badges/me
// 返回全部勋章及当前用户的获得状态。未获得的也必须返回：
// 前端 badges.wxml 靠 item.obtained 决定渲染彩色还是灰色。
exports.getMyBadges = async (req, res, next) => {
  try {
    const all = await Badge.listAll();
    const obtained = new Set(await Badge.listObtainedIds(req.user.id));
    res.success(all.map((b) => dto.toBadge(b, obtained.has(b.id))));
  } catch (err) {
    next(err);
  }
};
