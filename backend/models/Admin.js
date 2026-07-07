const db = require('../config/db');

const Admin = {
  async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0];
  },

  async updateFailedCount(id, count) {
    await db.query('UPDATE admins SET failed_count = ? WHERE id = ?', [count, id]);
  },

  async lock(id, untilTime) {
    await db.query('UPDATE admins SET locked_until = ? WHERE id = ?', [untilTime, id]);
  },

  async resetFailedCount(id) {
    await db.query('UPDATE admins SET failed_count = 0, locked_until = NULL WHERE id = ?', [id]);
  }
};

module.exports = Admin;