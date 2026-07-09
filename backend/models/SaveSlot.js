const db = require('../config/db');

const SaveSlot = {
  // 获取用户对某个剧情的所有存档
  async findByUserAndStory(userId, storyId) {
    const [rows] = await db.query(
      `SELECT slot_id, user_id, story_id, node_id, slot_index, save_time 
       FROM save_slots 
       WHERE user_id = ? AND story_id = ? 
       ORDER BY slot_index`,
      [userId, storyId]
    );
    return rows;
  },

  // 获取某个存档详情
  async findById(slotId) {
    const [rows] = await db.query('SELECT * FROM save_slots WHERE slot_id = ?', [slotId]);
    return rows[0];
  },

  // 保存或更新存档（如果slot_index已存在则覆盖）
  async saveOrUpdate(userId, storyId, nodeId, slotIndex) {
    const [result] = await db.query(
      `INSERT INTO save_slots (user_id, story_id, node_id, slot_index, save_time)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE node_id = VALUES(node_id), save_time = VALUES(save_time)`,
      [userId, storyId, nodeId, slotIndex]
    );
    return result;
  },

  // 删除存档
  async deleteById(slotId) {
    const [result] = await db.query('DELETE FROM save_slots WHERE slot_id = ?', [slotId]);
    return result.affectedRows > 0;
  },

  // 统计用户对某个剧情的存档数量
  async countByUserAndStory(userId, storyId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM save_slots WHERE user_id = ? AND story_id = ?',
      [userId, storyId]
    );
    return rows[0].count;
  }
};

module.exports = SaveSlot;