const User = require('../models/User');
const C = require('../utils/constants');

exports.getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { openid, register_time, update_time, ...rest } = user;
    res.success({
      ...rest,
      registerTime: register_time,
      updateTime: update_time
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, gender, grade, college, major } = req.body;

    if (!name || !gender) {
      return res.fail(C.PARAM_MISSING, '姓名和性别为必填项');
    }

    // 字段长度校验（防止数据库异常）
    const nameLen = (name || '').length;
    const genderLen = (gender || '').length;
    const gradeLen = (grade || '').length;
    const collegeLen = (college || '').length;
    const majorLen = (major || '').length;

    if (nameLen > 50) return res.fail(C.PARAM_INVALID, '姓名长度不能超过50个字符');
    if (genderLen > 10) return res.fail(C.PARAM_INVALID, '性别长度不能超过10个字符');
    if (gradeLen > 20) return res.fail(C.PARAM_INVALID, '年级长度不能超过20个字符');
    if (collegeLen > 100) return res.fail(C.PARAM_INVALID, '学院长度不能超过100个字符');
    if (majorLen > 100) return res.fail(C.PARAM_INVALID, '专业长度不能超过100个字符');

    const updatedUser = await User.updateProfile(req.user.id, {
      name, gender, grade, college, major
    });

    const { openid, register_time, update_time, ...rest } = updatedUser;
    res.success({
      ...rest,
      registerTime: register_time,
      updateTime: update_time
    });
  } catch (err) {
    next(err);
  }
};