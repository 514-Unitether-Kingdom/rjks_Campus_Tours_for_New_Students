const db = require('../config/db');

const ProcessMarker = {
  // 获取所有流程标记（包含关联的短剧情信息）
  async findAll() {
    const [rows] = await db.query(
      `SELECT pm.*, s.name AS story_name, s.id AS story_id 
       FROM process_markers pm 
       LEFT JOIN stories s ON pm.short_story_id = s.id`
    );
    return rows;
  },

  // 根据短剧情ID获取标记
  async findByStoryId(storyId) {
    const [rows] = await db.query(
      'SELECT * FROM process_markers WHERE short_story_id = ?',
      [storyId]
    );
    return rows[0];
  }
};

module.exports = ProcessMarker;