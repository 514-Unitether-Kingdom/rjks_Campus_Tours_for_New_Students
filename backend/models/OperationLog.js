const db = require('../config/db');

// 《软件设计说明》5.5：exportUsers 伪代码要求
// OperationLogRepository.insert(adminId, 'EXPORT_USERS')。
// 导出人不写进文件名（信息暴露 + 文件名非法字符），改为记录在此表。
const OperationLog = {
  async record({ operatorId, action, targetType = null, targetId = null, ip = null }) {
    await db.query(
      `INSERT INTO operation_logs (operator_id, action, target_type, target_id, ip)
       VALUES (?, ?, ?, ?, ?)`,
      [operatorId, action, targetType, targetId, ip ? String(ip).slice(0, 64) : null]
    );
  },

  async listRecent(limit = 50) {
    const [rows] = await db.query(
      'SELECT * FROM operation_logs ORDER BY id DESC LIMIT ?', [limit]
    );
    return rows;
  }
};

module.exports = OperationLog;
