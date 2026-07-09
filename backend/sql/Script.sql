-- 强制本次会话使用 utf8mb4。
-- Windows 中文环境下 mysql.exe 的 character_set_client 默认是 gbk，
-- 直接 `mysql -u root -p db < 本文件` 会把 UTF-8 的中文按 GBK 解释后入库，
-- 存进去就是乱码。用 GBK 客户端查回来看着还是对的，只有应用（utf8mb4）读时才暴露。
SET NAMES utf8mb4;

-- =============================================
-- 探校之旅 —— 核心表（T6：认证与用户，后端 A 负责）
--
-- 执行前请先创建并选择数据库，库名需与 backend/.env 中的 DB_NAME 一致：
--   CREATE DATABASE IF NOT EXISTS tanxiaozhilv DEFAULT CHARSET utf8mb4;
--   USE tanxiaozhilv;
--
-- 完整初始化顺序：
--   1. Script.sql      （本文件：users / admins）
--   2. t7_schema.sql   （剧情 / 勋章 / 存档 / 标记 / 地图 / 日志，后端 B 负责）
--   3. t7_seed.sql     （初始数据）
--
-- 本脚本可重复执行。
-- =============================================

-- 1.用户表
CREATE TABLE IF NOT EXISTS `users` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL DEFAULT '',
    gender VARCHAR(10) NOT NULL DEFAULT '',
    grade VARCHAR(20) DEFAULT '',
    college VARCHAR(100) DEFAULT '',
    major VARCHAR(100) DEFAULT '',
    register_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基础信息';

-- 2.管理员表
CREATE TABLE IF NOT EXISTS `admins` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    failed_count INT DEFAULT 0,
    locked_until DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员账号';

-- 默认管理员：admin / 123456（与《原型说明》4.3、8.3 记载的演示账号一致）
-- 修正：原先写入的 hash（$2b$10$MzyexXCjq...946m）经 bcrypt.compareSync 验证并非 123456，
--       导致管理员无法登录后台。此处重新生成。
INSERT IGNORE INTO admins (username, password_hash)
VALUES ('admin', '$2b$10$IgAvRevhQ7DgnsUzKv1Lcu9ktF66zxOdpDyHD9a/Y8leHG8DmCxvm');

-- 若库中已存在旧的错误 hash，一并修复（便于队友直接重跑本脚本）
UPDATE admins
SET password_hash = '$2b$10$IgAvRevhQ7DgnsUzKv1Lcu9ktF66zxOdpDyHD9a/Y8leHG8DmCxvm',
    failed_count = 0, locked_until = NULL
WHERE username = 'admin'
  AND password_hash = '$2b$10$MzyexXCjqXOUXQX8CLnelOi2namly3jkNRt2srr.ITfYQ7waZ946m';
