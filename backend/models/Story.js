const db = require('../config/db');

const Story = {
  // ---------- 基础查询（已存在） ----------
  // 获取所有启用的剧情
  async findAll() {
    const [rows] = await db.query('SELECT * FROM stories WHERE status = "enabled"');
    return rows;
  },

  // 根据ID获取单个剧情
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM stories WHERE id = ?', [id]);
    return rows[0];
  },

  // ---------- 新增方法（供后续功能使用） ----------
  // 获取剧情及其所有节点（按顺序）
  async findWithNodes(id) {
    const story = await this.findById(id);
    if (!story) return null;
    const [nodes] = await db.query(
      'SELECT * FROM story_nodes WHERE story_id = ? ORDER BY sort_order',
      [id]
    );
    story.nodes = nodes;
    return story;
  },

  // 检查剧情是否为长故事
  async isLongStory(id) {
    const [rows] = await db.query('SELECT type FROM stories WHERE id = ?', [id]);
    return rows.length > 0 && rows[0].type === 'long';
  },

  // 获取剧情关联的勋章ID
  async getBadgeId(id) {
    const [rows] = await db.query('SELECT badge_id FROM stories WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0].badge_id : null;
  }
};

module.exports = Story;