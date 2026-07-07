const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 导出 promise 版本的 pool，这样可以用 async/await
module.exports = pool.promise();