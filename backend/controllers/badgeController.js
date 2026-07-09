const Badge = require('../models/Badge');
const UserStoryProgress = require('../models/UserStoryProgress');

exports.getMyBadges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // 获取所有勋章
    const allBadges = await Badge.findAll();
    // 获取用户已获得的勋章ID
    const obtainedIds = await Badge.getUserBadgeIds(userId);
    // 组装状态
    const result = allBadges.map(badge => ({
      ...badge,
      obtained: obtainedIds.includes(badge.id)
    }));
    res.success(result);
  } catch (err) {
    next(err);
  }
};