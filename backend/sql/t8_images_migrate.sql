-- 强制本次会话使用 utf8mb4，防 Windows mysql 客户端 GBK 乱码。
SET NAMES utf8mb4;

-- =============================================
-- T8 AI 助手：给 kb_entries / qa_records 补 images 列（图文配图）。
-- 负责人：任晟达（后端 B）
-- 用于"表已存在"的库（本地/云上已建过表）。可重复执行：
-- 已有该列则跳过（MySQL 不支持 ADD COLUMN IF NOT EXISTS，用 information_schema 判断）。
-- 全新安装无需本文件，t8_ai_schema.sql 建表已含 images 列。
-- =============================================

-- kb_entries.images
SET @has_kb_images := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kb_entries' AND COLUMN_NAME = 'images'
);
SET @sql_kb := IF(@has_kb_images = 0,
  'ALTER TABLE kb_entries ADD COLUMN images JSON NULL COMMENT ''配图 [{url,desc}]'' AFTER source',
  'SELECT 1');
PREPARE s1 FROM @sql_kb; EXECUTE s1; DEALLOCATE PREPARE s1;

-- qa_records.images
SET @has_qa_images := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'qa_records' AND COLUMN_NAME = 'images'
);
SET @sql_qa := IF(@has_qa_images = 0,
  'ALTER TABLE qa_records ADD COLUMN images JSON NULL COMMENT ''本次回答展示的配图'' AFTER answer',
  'SELECT 1');
PREPARE s2 FROM @sql_qa; EXECUTE s2; DEALLOCATE PREPARE s2;
