const db = require('../config/db');

const Badge = {
  // 勋章墙要展示全部 4 枚（含未获得的灰色显示），故不按剧情 status 过滤
  async listAll() {
    const [rows] = await db.query('SELECT * FROM badges ORDER BY sort_order, id');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM badges WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const [rows] = await db.query('SELECT * FROM badges WHERE code = ?', [code]);
    return rows[0] || null;
  },

  // 到点即时发章（浏览校园逛到食堂/运动区时调用）。INSERT IGNORE 幂等：
  // 重复走到同一区域不会重复发、也不撞 (user_id,badge_id) 主键。
  // 返回 alreadyObtained，供前端决定要不要弹"获得新徽章"提示。
  async grantByCode(userId, badgeId, storyId) {
    const [ins] = await db.query(
      'INSERT IGNORE INTO user_badges (user_id, badge_id, story_id) VALUES (?, ?, ?)',
      [userId, badgeId, storyId]
    );
    return { alreadyObtained: ins.affectedRows === 0 };
  },

  async listObtainedIds(userId) {
    const [rows] = await db.query(
      'SELECT badge_id FROM user_badges WHERE user_id = ?',
      [userId]
    );
    return rows.map((r) => r.badge_id);
  },

  // 后台统计：勋章发放总数（历史累计，(user_id,badge_id) 联合主键天然去重）
  async countAllObtained() {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM user_badges');
    return rows[0].total;
  }
};

module.exports = Badge;
