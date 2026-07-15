-- 《浏览校园》剧情升级：可重复执行前请确认当前 MySQL 版本支持 JSON。
-- 已部署旧库执行本文件；新库直接使用 t7_schema.sql 即可。
ALTER TABLE story_nodes ADD COLUMN location_id VARCHAR(64) NULL COMMENT '剧情地图地点 ID';
ALTER TABLE story_nodes ADD COLUMN node_type ENUM('scene','map','choice') NOT NULL DEFAULT 'scene' COMMENT '剧情页类型';
ALTER TABLE story_nodes ADD COLUMN choices_json JSON NULL COMMENT '分支选项 JSON';

-- 剧情正文与节点清单见 docs/浏览校园剧情脚本.md。
-- 导入时：实景页 node_type='scene'；其后的地图页 node_type='map'；分支页 node_type='choice'。
