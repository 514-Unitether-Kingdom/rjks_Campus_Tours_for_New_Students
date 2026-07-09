const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const { signAdminToken } = require('../utils/jwt');

const User = require('../models/User');
const Story = require('../models/Story');
const Badge = require('../models/Badge');
const db = require('../config/db');
const exceljs = require('exceljs'); 

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

// 后台统计数据
exports.getStats = async (req, res, next) => {
  try {
    const [userCount] = await db.query('SELECT COUNT(*) AS total FROM users');
    const [badgeCount] = await db.query('SELECT COUNT(*) AS total FROM user_badges');
    const [storyCount] = await db.query('SELECT COUNT(*) AS total FROM stories');
    const [completedCount] = await db.query('SELECT COUNT(DISTINCT user_id) AS total FROM user_story_progress');
    res.success({
      totalUsers: userCount[0].total,
      totalBadges: badgeCount[0].total,
      totalStories: storyCount[0].total,
      totalCompletedUsers: completedCount[0].total
    });
  } catch (err) {
    next(err);
  }
};

// 获取用户列表（分页）
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const [rows] = await db.query(
      `SELECT id, openid, name, gender, grade, college, major, register_time, update_time 
       FROM users 
       ORDER BY id DESC 
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );
    const [totalRows] = await db.query('SELECT COUNT(*) AS total FROM users');
    res.success({
      list: rows,
      total: totalRows[0].total,
      page,
      pageSize
    });
  } catch (err) {
    next(err);
  }
};

// 导出用户数据为 Excel
exports.exportUsersExcel = async (req, res, next) => {
  try {
    const [users] = await db.query('SELECT id, openid, name, gender, grade, college, major, register_time FROM users');

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('用户数据');
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'OpenID', key: 'openid', width: 30 },
      { header: '姓名', key: 'name', width: 15 },
      { header: '性别', key: 'gender', width: 10 },
      { header: '年级', key: 'grade', width: 15 },
      { header: '学院', key: 'college', width: 20 },
      { header: '专业', key: 'major', width: 20 },
      { header: '注册时间', key: 'register_time', width: 20 }
    ];
    users.forEach(user => {
      worksheet.addRow(user);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// 导出剧情内容为 TXT
exports.exportStoriesTxt = async (req, res, next) => {
  try {
    const stories = await Story.findAll();
    let content = '===== 探校之旅剧情内容导出 =====\n\n';
    for (const story of stories) {
      content += `【${story.name}】（ID: ${story.id}, 类型: ${story.type}）\n`;
      content += `描述：${story.description || '无'}\n`;
      // 获取节点
      const [nodes] = await db.query(
        'SELECT * FROM story_nodes WHERE story_id = ? ORDER BY sort_order',
        [story.id]
      );
      nodes.forEach((node, index) => {
        content += `  ${index + 1}. ${node.speaker ? `【${node.speaker}】` : ''}${node.dialogue_text}\n`;
      });
      content += '\n----------------------------------------\n\n';
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=stories_${Date.now()}.txt`);
    res.send(content);
  } catch (err) {
    next(err);
  }
};