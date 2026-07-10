const db = require('../config/db');

// 前端以 code 调用（campus / medical），后台以自增 id 调用也应支持
const isNumericId = (ref) => /^\d+$/.test(String(ref));

const Story = {
  // 按 code 或自增 id 查找。前端 campus-story.js 写死 getStoryNodes('campus')，
  // 若只按自增 id 查，parseInt('campus') 得到 NaN，会永远返回"剧情不存在"。
  async findByRef(ref) {
    const sql = isNumericId(ref)
      ? 'SELECT * FROM stories WHERE id = ?'
      : 'SELECT * FROM stories WHERE code = ?';
    const [rows] = await db.query(sql, [ref]);
    return rows[0] || null;
  },

  // 前端可见的剧情列表。type 可选：'long' / 'short'
  async listEnabled(type) {
    const params = [];
    let sql = "SELECT * FROM stories WHERE status = 'enabled'";
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY id';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  // 后台预览与导出需要包含 disabled 的剧情（F-12：预览全部剧情内容）
  async listAll() {
    const [rows] = await db.query('SELECT * FROM stories ORDER BY id');
    return rows;
  },

  // 按 sort_order 返回节点。fromNodeKey 用于读档续读：只返回该节点及之后的部分。
  // 注：当前前端一次性拉全部节点再自行 seek，故该参数默认不传。
  async listNodes(storyId, fromNodeKey) {
    const [rows] = await db.query(
      'SELECT * FROM story_nodes WHERE story_id = ? ORDER BY sort_order',
      [storyId]
    );
    if (!fromNodeKey) return rows;
    const idx = rows.findIndex((n) => n.node_key === fromNodeKey);
    return idx === -1 ? rows : rows.slice(idx);
  },

  async findNodeByKey(storyId, nodeKey) {
    const [rows] = await db.query(
      'SELECT * FROM story_nodes WHERE story_id = ? AND node_key = ?',
      [storyId, nodeKey]
    );
    return rows[0] || null;
  },

  async findEndNodeId(storyId) {
    const [rows] = await db.query(
      'SELECT id FROM story_nodes WHERE story_id = ? AND is_end = 1 ORDER BY sort_order LIMIT 1',
      [storyId]
    );
    return rows.length ? rows[0].id : null;
  },

  async countAll() {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM stories');
    return rows[0].total;
  }
};

module.exports = Story;
