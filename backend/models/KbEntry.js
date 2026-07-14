const db = require('../config/db');

// images 列是 JSON。mysql2 多数情况会自动解析成 JS 数组，
// 但为兼容不同版本/配置（有时返回字符串），统一在这里兜底解析。
function parseImages(row) {
  if (row && typeof row.images === 'string') {
    try { row.images = JSON.parse(row.images); } catch (e) { row.images = null; }
  }
  return row;
}

// AI 助手知识库。检索用 MySQL 8 的 ngram 全文索引（对中文分词），比 LIKE 准。
const KbEntry = {
  // 按问题检索最相关的若干条 enabled 知识；无匹配返回空数组
  async search(query, limit = 5) {
    const q = String(query || '').trim();
    if (!q) return [];
    const [rows] = await db.query(
      `SELECT id, category, question, answer, contact, source, images,
              MATCH(question, answer, keywords) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
       FROM kb_entries
       WHERE status = 'enabled'
         AND MATCH(question, answer, keywords) AGAINST (? IN NATURAL LANGUAGE MODE)
       ORDER BY score DESC
       LIMIT ?`,
      [q, q, limit]
    );
    return rows.map(parseImages);
  },

  async listAll() {
    const [rows] = await db.query('SELECT * FROM kb_entries ORDER BY category, id');
    return rows.map(parseImages);
  },

  // 仅取主题字段，供配图相关性闸门统计"通用词"（比 listAll 轻）
  async allTopics() {
    const [rows] = await db.query(
      "SELECT question, keywords FROM kb_entries WHERE status = 'enabled'"
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM kb_entries WHERE id = ?', [id]);
    return rows[0] ? parseImages(rows[0]) : null;
  },

  async create(d) {
    const [r] = await db.query(
      `INSERT INTO kb_entries (category, question, answer, keywords, contact, source, images, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.category, d.question, d.answer, d.keywords || '', d.contact || '', d.source || '',
       d.images != null ? JSON.stringify(d.images) : null, d.status || 'enabled']
    );
    return r.insertId;
  },

  async update(id, d) {
    await db.query(
      `UPDATE kb_entries SET category = ?, question = ?, answer = ?, keywords = ?,
              contact = ?, source = ?, images = ?, status = ? WHERE id = ?`,
      [d.category, d.question, d.answer, d.keywords || '', d.contact || '', d.source || '',
       d.images != null ? JSON.stringify(d.images) : null, d.status || 'enabled', id]
    );
  },

  async remove(id) {
    const [r] = await db.query('DELETE FROM kb_entries WHERE id = ?', [id]);
    return r.affectedRows > 0;
  }
};

module.exports = KbEntry;
