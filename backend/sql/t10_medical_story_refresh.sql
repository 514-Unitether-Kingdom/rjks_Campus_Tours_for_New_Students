-- 《医保报销流程》多分支剧情刷新脚本。
-- 请在 backend/sql 目录中用 MySQL 命令行执行本文件；它会调用同目录下更新后的 t7_seed.sql。
-- 仅重建 medical 的剧情节点；已获得的徽章不会删除，已有的短剧情进度节点会被置空。

SET NAMES utf8mb4;

DELETE FROM story_nodes
WHERE story_id=(SELECT id FROM stories WHERE code='medical');

-- 重新插入新版 medical 节点。t7_seed.sql 同时会尝试插入早期 campus 占位节点，
-- 因当前 campus 使用 t9 剧情，以下清理确保不会混入旧占位内容。
SOURCE t7_seed.sql;

DELETE FROM story_nodes
WHERE story_id=(SELECT id FROM stories WHERE code='campus')
  AND node_key IN ('n1', 'n2', 'n3', 'n4', 'n5', 'n_end');
