-- =============================================
-- 探校之旅 核心数据库建表脚本
--
-- 执行前请先创建并选择数据库，库名需与 backend/.env 中的 DB_NAME 一致：
--   CREATE DATABASE IF NOT EXISTS tanxiaozhilv DEFAULT CHARSET utf8mb4;
--   USE tanxiaozhilv;
--
-- 本脚本可重复执行（建表用 IF NOT EXISTS，插入用 INSERT IGNORE）。
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

-- 默认管理员：admin / 123456（password_hash 为 bcrypt 结果）
INSERT IGNORE INTO admins (username, password_hash)
VALUES ('admin', '$2b$10$MzyexXCjqXOUXQX8CLnelOi2namly3jkNRt2srr.ITfYQ7waZ946m');


-- =============================================
-- 任晟达需要的表（剧情、勋章、存档）
-- =============================================

-- 3. 剧情主表
CREATE TABLE IF NOT EXISTS `stories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT '剧情编码(如campus)',
  `name` VARCHAR(100) NOT NULL COMMENT '剧情名称',
  `type` VARCHAR(20) NOT NULL COMMENT 'long 或 short',
  `description` TEXT COMMENT '剧情描述',
  `badge_id` INT COMMENT '关联勋章ID',
  `max_saves` INT DEFAULT 5 COMMENT '最大存档数',
  `status` VARCHAR(20) DEFAULT 'enabled'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='剧情定义';

-- 4. 剧情节点表
CREATE TABLE IF NOT EXISTS `story_nodes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `story_id` INT NOT NULL COMMENT '所属剧情ID',
  `dialogue_text` TEXT NOT NULL COMMENT '对话内容',
  `speaker` VARCHAR(50) COMMENT '说话人',
  `bg_image_url` VARCHAR(255) COMMENT '背景图URL',
  `is_end` BOOLEAN DEFAULT FALSE COMMENT '是否结束节点',
  `sort_order` INT NOT NULL COMMENT '显示顺序',
  UNIQUE KEY `uk_story_sort` (`story_id`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='剧情节点';

-- 5. 勋章定义表
CREATE TABLE IF NOT EXISTS `badges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT '勋章编码',
  `name` VARCHAR(50) NOT NULL,
  `icon_url` VARCHAR(255) NOT NULL,
  `description` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='勋章定义';

-- 6. 用户获得勋章（多对多关系）
CREATE TABLE IF NOT EXISTS `user_badges` (
  `user_id` INT NOT NULL,
  `badge_id` INT NOT NULL,
  `story_id` INT NOT NULL COMMENT '完成哪个剧情获得的',
  `obtained_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `badge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户勋章关系';

-- 7. 存档表（长故事专用）
CREATE TABLE IF NOT EXISTS `save_slots` (
  `slot_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `node_id` INT NOT NULL,
  `slot_index` INT NOT NULL COMMENT '档位编号 1-5',
  `save_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_slot` (`user_id`, `story_id`, `slot_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户存档记录';

-- 8.记录用户剧情完成状态的表
CREATE TABLE IF NOT EXISTS `user_story_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `completed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_story` (`user_id`, `story_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户剧情完成记录';

-- 9.创建办事流程标记表
CREATE TABLE IF NOT EXISTS `process_markers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '标记名称',
  `position_x` DECIMAL(10,2) NOT NULL COMMENT 'X坐标（百分比）',
  `position_y` DECIMAL(10,2) NOT NULL COMMENT 'Y坐标（百分比）',
  `short_story_id` INT NOT NULL COMMENT '关联的短剧情ID',
  UNIQUE KEY `uk_marker_name` (`name`),
  FOREIGN KEY (`short_story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='办事流程地图标记';


-- =============================================
-- 测试数据
-- 注意：stories.code / badges.code 的取值需与前端 utils/api.js 中的硬编码一致
--       （campus / medical，badge_campus / badge_medical）。
--       当前取值待 T7 分支统一修正，此处仅保证脚本可执行。
-- =============================================

INSERT IGNORE INTO badges (code, name, icon_url, description) VALUES
('campus_explorer', '校园探险家', 'https://example.com/badge1.png', '完成校园巡礼剧情'),
('insurance_expert', '医保达人', 'https://example.com/badge2.png', '完成医保报销流程');

INSERT IGNORE INTO stories (code, name, type, description, badge_id, max_saves) VALUES
('campus_tour', '校园巡礼', 'long', '跟随学姐学长一起探索校园',
 (SELECT id FROM badges WHERE code = 'campus_explorer'), 5);

INSERT IGNORE INTO stories (code, name, type, description, badge_id) VALUES
('insurance', '医保报销指南', 'short', '了解校医院医保报销流程',
 (SELECT id FROM badges WHERE code = 'insurance_expert'));

INSERT IGNORE INTO story_nodes (story_id, dialogue_text, speaker, bg_image_url, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='campus_tour'), '欢迎来到北京工业大学！我是你的向导学姐。', '学姐', 'https://example.com/bg1.jpg', 0, 1),
((SELECT id FROM stories WHERE code='campus_tour'), '这是第一教学楼，大部分课程都在这里上。', '学姐', 'https://example.com/bg2.jpg', 0, 2),
((SELECT id FROM stories WHERE code='campus_tour'), '最后，我们来到了校医院，医保报销就在这里办理。', '学姐', 'https://example.com/bg3.jpg', 1, 3);

INSERT IGNORE INTO story_nodes (story_id, dialogue_text, speaker, bg_image_url, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='insurance'), '医保报销流程：先挂号，再就诊，最后缴费。', '系统', 'https://example.com/process1.jpg', 0, 1),
((SELECT id FROM stories WHERE code='insurance'), '请携带学生证和医保卡到窗口办理。', '系统', 'https://example.com/process2.jpg', 1, 2);

INSERT IGNORE INTO process_markers (name, position_x, position_y, short_story_id) VALUES
('校医院挂号处', 20.5, 45.3, (SELECT id FROM stories WHERE code='insurance'));
