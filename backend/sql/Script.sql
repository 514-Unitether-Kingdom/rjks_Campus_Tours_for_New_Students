-- =============================================
-- 探校之旅 核心数据库建表脚本
-- 数据库名：campus_explore
-- =============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `openid` VARCHAR(64) NOT NULL UNIQUE COMMENT '微信唯一标识',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `gender` VARCHAR(10) NOT NULL COMMENT '性别',
  `college` VARCHAR(100) COMMENT '学院',
  `major` VARCHAR(100) COMMENT '专业',
  `register_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基础信息';

-- 2. 管理员表
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE COMMENT '关联users.id',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '管理员账号',
  `password_hash` VARCHAR(128) NOT NULL COMMENT '密码哈希(后续用bcrypt)',
  `failed_count` INT DEFAULT 0 COMMENT '登录失败次数',
  `locked_until` DATETIME COMMENT '锁定截止时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员扩展信息';

-- 3. 剧情主表（长/短故事统一存储）
CREATE TABLE IF NOT EXISTS `stories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT '剧情编码(如campus)',
  `name` VARCHAR(100) NOT NULL COMMENT '剧情名称',
  `type` VARCHAR(20) NOT NULL COMMENT 'long 或 short',
  `description` TEXT COMMENT '剧情描述',
  `badge_id` INT COMMENT '关联勋章ID(暂不建外键,避免循环)',
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
  `sort_order` INT NOT NULL COMMENT '显示顺序(1,2,3...)',
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE
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
  PRIMARY KEY (`user_id`, `badge_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户勋章关系';

-- 7. 存档表（长故事专用）
CREATE TABLE IF NOT EXISTS `save_slots` (
  `slot_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `story_id` INT NOT NULL,
  `node_id` INT NOT NULL,
  `slot_index` INT NOT NULL COMMENT '档位编号 1-5',
  `save_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_slot` (`user_id`, `story_id`, `slot_index`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`node_id`) REFERENCES `story_nodes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户存档记录';


-- 用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL DEFAULT '',
    gender VARCHAR(10) NOT NULL DEFAULT '',
    grade VARCHAR(20) DEFAULT '',
    college VARCHAR(100) DEFAULT '',
    major VARCHAR(100) DEFAULT '',
    register_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 管理员表
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    failed_count INT DEFAULT 0,
    locked_until DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 先随便插入一个管理员（密码稍后我们更新成加密的）
INSERT INTO admins (username, password_hash) VALUES ('admin', 'temp');

UPDATE admins SET password_hash = '$2b$10$MzyexXCjqXOUXQX8CLnelOi2namly3jkNRt2srr.ITfYQ7waZ946m' WHERE username = 'admin';
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
  `sort_order` INT NOT NULL COMMENT '显示顺序'
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