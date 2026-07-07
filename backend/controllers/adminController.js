const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const { signAdminToken } = require('../utils/jwt');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.fail(2001, '用户名和密码不能为空');
    }

    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.fail(3001, '用户名或密码错误');
    }

    // 检查是否被锁定
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return res.fail(3002, `账号已被锁定，请于 ${admin.locked_until.toLocaleString()} 后重试`);
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      const failed = (admin.failed_count || 0) + 1;
      await Admin.updateFailedCount(admin.id, failed);

      if (failed >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await Admin.lock(admin.id, lockUntil);
        return res.fail(3002, '连续失败5次，账号已锁定15分钟');
      }
      return res.fail(3001, `用户名或密码错误，还剩 ${5 - failed} 次机会`);
    }

    // 登录成功，重置失败次数
    await Admin.resetFailedCount(admin.id);
    const token = signAdminToken(admin.id);
    res.success({ token });
  } catch (err) {
    next(err);
  }
};