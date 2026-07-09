
const db = require('../config/db');

const Badge = {
  // 获取所有勋章定义
  async findAll() {
    const [rows] = await db.query('SELECT * FROM badges ORDER BY id');
    return rows;
  },

  // 根据ID获取勋章
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM badges WHERE id = ?', [id]);
    return rows[0];
  },

  // 获取用户已获得的勋章ID列表
  async getUserBadgeIds(userId) {
    const [rows] = await db.query(
      'SELECT badge_id FROM user_badges WHERE user_id = ?',
      [userId]
    );
    return rows.map(row => row.badge_id);
  },

  // 授予用户勋章（幂等）
  async grantToUser(userId, badgeId, storyId) {
    const [result] = await db.query(
      'INSERT IGNORE INTO user_badges (user_id, badge_id, story_id) VALUES (?, ?, ?)',
      [userId, badgeId, storyId]
    );
    return result.affectedRows > 0; // 是否新授予
  }
};

module.exports = Badge;