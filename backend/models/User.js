const db = require('../config/db');

const User = {
  // 根据微信openid查找用户
  async findByOpenid(openid) {
    const [rows] = await db.query('SELECT * FROM users WHERE openid = ?', [openid]);
    return rows[0];
  },

  // 创建新用户（姓名性别默认为空）
  async create({ openid, name = '', gender = '', grade = '', college = '', major = '' }) {
    const [result] = await db.query(
      'INSERT INTO users (openid, name, gender, grade, college, major) VALUES (?, ?, ?, ?, ?, ?)',
      [openid, name, gender, grade, college, major]
    );
    return { id: result.insertId, openid, name, gender, grade, college, major };
  },

  // 更新用户信息
  async updateProfile(id, data) {
    const { name, gender, grade, college, major } = data;
    await db.query(
      'UPDATE users SET name=?, gender=?, grade=?, college=?, major=? WHERE id=?',
      [name, gender, grade, college, major, id]
    );
    return this.findById(id);
  },

  // 根据ID查找用户
  async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = User;