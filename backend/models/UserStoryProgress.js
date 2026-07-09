const db = require('../config/db');

const UserStoryProgress = {
  // 标记用户完成某个剧情（幂等）
  async markCompleted(userId, storyId) {
    const [rows] = await db.query(
      'INSERT IGNORE INTO user_story_progress (user_id, story_id) VALUES (?, ?)',
      [userId, storyId]
    );
    return rows.affectedRows > 0; // 是否新插入
  },

  // 检查用户是否已完成某个剧情
  async isCompleted(userId, storyId) {
    const [rows] = await db.query(
      'SELECT 1 FROM user_story_progress WHERE user_id = ? AND story_id = ?',
      [userId, storyId]
    );
    return rows.length > 0;
  },

  // 获取用户所有已完成的剧情ID列表
  async getCompletedStoryIds(userId) {
    const [rows] = await db.query(
      'SELECT story_id FROM user_story_progress WHERE user_id = ?',
      [userId]
    );
    return rows.map(row => row.story_id);
  }
};

module.exports = UserStoryProgress;