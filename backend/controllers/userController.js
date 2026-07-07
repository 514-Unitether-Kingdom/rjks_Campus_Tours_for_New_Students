const User = require('../models/User');

exports.getProfile = async (req, res, next) => {
  try {
    const user = req.user; // 从中间件获取
    // 不返回 openid
    const { openid, ...profile } = user;
    res.success(profile);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, gender, grade, college, major } = req.body;
    if (!name || !gender) {
      return res.fail(2001, '姓名和性别为必填项');
    }

    const updatedUser = await User.updateProfile(req.user.id, {
      name, gender, grade, college, major
    });

    const { openid, ...profile } = updatedUser;
    res.success(profile);
  } catch (err) {
    next(err);
  }
};