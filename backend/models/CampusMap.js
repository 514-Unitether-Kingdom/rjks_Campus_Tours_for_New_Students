const db = require('../config/db');

const CampusMap = {
  // 当前生效的地图版本。多版本时取最新的一条。
  async findActive() {
    const [rows] = await db.query(
      'SELECT * FROM campus_maps WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
    );
    return rows[0] || null;
  },

  // 记录查看行为（user_map_views）。属统计用途，失败不应影响地图返回，
  // 故调用方以 best-effort 方式吞掉异常。
  async recordView(userId, mapId, deviceInfo) {
    await db.query(
      'INSERT INTO user_map_views (user_id, map_id, view_time, device_info) VALUES (?, ?, NOW(), ?)',
      [userId, mapId, deviceInfo ? String(deviceInfo).slice(0, 255) : null]
    );
  }
};

module.exports = CampusMap;
