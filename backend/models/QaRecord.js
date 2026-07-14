const db = require('../config/db');

// AI 助手问答记录
const QaRecord = {
  async create(d) {
    const [r] = await db.query(
      `INSERT INTO qa_records (user_id, session_id, question, answer, images, sources, category, answered_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.userId || null, d.sessionId || null, d.question, d.answer || '',
       d.images != null ? JSON.stringify(d.images) : null,
       d.sources || '', d.category || '', d.answeredBy || 'ai']
    );
    return r.insertId;
  },

  // 点赞/点踩，按 user_id 校验归属（只能评自己的那条）
  async setFeedback(id, userId, value) {
    const [r] = await db.query(
      'UPDATE qa_records SET feedback = ? WHERE id = ? AND user_id = ?',
      [value, id, userId]
    );
    return r.affectedRows > 0;
  },

  async listByUser(userId, limit = 20) {
    const [rows] = await db.query(
      'SELECT id, question, answer, images, feedback, created_at FROM qa_records WHERE user_id = ? ORDER BY id DESC LIMIT ?',
      [userId, limit]
    );
    // images 是 JSON 列，mysql2 多数会自动解析；兜底处理字符串情况。
    return rows.map((r) => {
      if (typeof r.images === 'string') {
        try { r.images = JSON.parse(r.images); } catch (e) { r.images = null; }
      }
      return r;
    });
  },

  async listRecent(limit = 50, offset = 0) {
    const [rows] = await db.query(
      'SELECT * FROM qa_records ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows;
  },

  async countAll() {
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM qa_records');
    return rows[0].total;
  }
};

module.exports = QaRecord;
