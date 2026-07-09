const db = require('../config/db');

// 取代原 UserStoryProgress。表名依据《软件设计说明》第 3 章为 story_progress。
// 驱动三处功能：办事流程标记的勾/感叹号、后台剧情完成数、剧情按钮"已完成"标记。
const StoryProgress = {
  // 标记完成。幂等：重复完成同一剧情不会改写首次完成时间。
  // conn 可传入事务连接，勋章发放需要与之在同一事务内。
  async markCompleted(userId, storyId, endNodeId, conn = db) {
    const [res] = await conn.query(
      `INSERT INTO story_progress (user_id, story_id, current_node_id, completed, completed_time)
       VALUES (?, ?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE
         completed      = TRUE,
         current_node_id = VALUES(current_node_id),
         completed_time = IFNULL(completed_time, NOW())`,
      [userId, storyId, endNodeId]
    );
    // affectedRows: 1=新插入，2=更新了已有行，0=值完全相同未变更
    return res.affectedRows === 1;
  },

  async isCompleted(userId, storyId) {
    const [rows] = await db.query(
      'SELECT 1 FROM story_progress WHERE user_id = ? AND story_id = ? AND completed = 1',
      [userId, storyId]
    );
    return rows.length > 0;
  },

  async listCompletedStoryIds(userId) {
    const [rows] = await db.query(
      'SELECT story_id FROM story_progress WHERE user_id = ? AND completed = 1',
      [userId]
    );
    return rows.map((r) => r.story_id);
  },

  // 后台统计「剧情完成数」。
  // 待澄清事项 Q-13 的结论是「历史累计数，不包含重复计数」：
  // uk_progress(user_id, story_id) 保证一人一剧情至多一行，直接 COUNT(*) 即可。
  // 注意这不是 COUNT(DISTINCT user_id)——那统计的是"完成过任意剧情的人数"。
  async countCompleted() {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS total FROM story_progress WHERE completed = 1'
    );
    return rows[0].total;
  }
};

module.exports = StoryProgress;
