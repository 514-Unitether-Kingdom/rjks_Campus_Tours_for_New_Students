const db = require('../config/db');

// 存档列表需一并带出剧情名与节点摘要（待澄清事项 Q-08 的结论：
// 存档摘要须包含存档时间、保存结点、对应剧情名称）
const LIST_SQL = `
  SELECT ss.slot_id, ss.slot_index, ss.save_time,
         st.code AS story_code, st.name AS story_name,
         n.node_key, n.sort_order, n.dialogue_text
  FROM save_slots ss
  JOIN stories     st ON ss.story_id = st.id
  JOIN story_nodes n  ON ss.node_id  = n.id
  WHERE ss.user_id = ?`;

const SaveSlot = {
  // FN-11-01：按存档时间倒序。storyId 可选，不传则返回该用户全部存档。
  async listByUser(userId, storyId) {
    const params = [userId];
    let sql = LIST_SQL;
    if (storyId) { sql += ' AND ss.story_id = ?'; params.push(storyId); }
    sql += ' ORDER BY ss.save_time DESC';
    const [rows] = await db.query(sql, params);
    return rows;
  },

  async findById(slotId) {
    const [rows] = await db.query('SELECT * FROM save_slots WHERE slot_id = ?', [slotId]);
    return rows[0] || null;
  },

  async deleteById(slotId) {
    const [res] = await db.query('DELETE FROM save_slots WHERE slot_id = ?', [slotId]);
    return res.affectedRows > 0;
  },

  // 在事务内取已占用的档位并加行锁。
  // 不加锁的话，同一用户并发存档时两个请求可能选到同一个空闲档位，
  // 撞上 uk_slot(user_id, story_id, slot_index) 唯一键报 500。
  async lockUsedSlotIndexes(conn, userId, storyId) {
    const [rows] = await conn.query(
      'SELECT slot_index FROM save_slots WHERE user_id = ? AND story_id = ? FOR UPDATE',
      [userId, storyId]
    );
    return rows.map((r) => r.slot_index);
  },

  // slotIndex 已存在则覆盖该档位，否则新建
  async upsert(conn, userId, storyId, nodeId, slotIndex) {
    await conn.query(
      `INSERT INTO save_slots (user_id, story_id, node_id, slot_index, save_time)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE node_id = VALUES(node_id), save_time = VALUES(save_time)`,
      [userId, storyId, nodeId, slotIndex]
    );
  },

  // 返回 1..maxSaves 中最小的空闲档位；全部占满则返回 null
  nextFreeIndex(usedIndexes, maxSaves) {
    const used = new Set(usedIndexes);
    for (let i = 1; i <= maxSaves; i++) {
      if (!used.has(i)) return i;
    }
    return null;
  }
};

module.exports = SaveSlot;
