const db = require('../config/db');

const SELECT_SQL = `
  SELECT pm.id, pm.code, pm.name, pm.description, pm.steps,
         pm.position_x, pm.position_y, pm.status, pm.sort_order,
         pm.short_story_id,
         s.code AS story_code, s.name AS story_name
  FROM process_markers pm
  JOIN stories s ON pm.short_story_id = s.id`;

const ProcessMarker = {
  // 只下发 status='enabled' 的标记。
  // 待澄清事项 Q-09 已定：V1.0 隐藏「一卡通补办」与「打印流程」入口，
  // 二者在 t7_seed.sql 中 status='hidden'，不会出现在响应里。
  async listVisible() {
    const [rows] = await db.query(
      `${SELECT_SQL} WHERE pm.status = 'enabled' ORDER BY pm.sort_order, pm.id`
    );
    return rows;
  },

  async listAll() {
    const [rows] = await db.query(`${SELECT_SQL} ORDER BY pm.sort_order, pm.id`);
    return rows;
  }
};

module.exports = ProcessMarker;
