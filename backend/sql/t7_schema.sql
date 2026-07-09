-- =============================================
-- 探校之旅 —— 业务表（T7：剧情 / 勋章 / 存档 / 流程标记 / 地图 / 日志）
-- 负责人：任晟达（后端 B）
--
-- 依赖：先执行 Script.sql（创建 users / admins）
-- 本脚本可重复执行。
--
-- 设计依据：《探校之旅软件设计说明》第 3 章、《需求规格说明书》3.2
-- =============================================

-- ---------------------------------------------
-- 1. 勋章定义
--    icon_url 只存一份彩色图；未获得时的灰色效果由前端 CSS 滤镜实现
--    （《需求规格说明书》3.2.8：彩色/灰色由前端通过是否获得控制）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `badges` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `code`           VARCHAR(50)  NOT NULL COMMENT '勋章编码，前端硬编码依赖，如 badge_campus',
  `name`           VARCHAR(50)  NOT NULL COMMENT '勋章名称',
  `icon_url`       VARCHAR(255) NOT NULL COMMENT '勋章图标路径（原样字符串，后端不做拼接）',
  `description`    VARCHAR(255) COMMENT '勋章描述',
  `condition_text` VARCHAR(255) COMMENT '达成条件文案',
  `sort_order`     INT NOT NULL DEFAULT 0 COMMENT '勋章墙展示顺序',
  UNIQUE KEY `uk_badge_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='勋章定义';


-- ---------------------------------------------
-- 2. 剧情主表（长/短故事统一存储，靠 type 区分）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `stories` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `code`        VARCHAR(50)  NOT NULL COMMENT '剧情编码，前端硬编码依赖：campus / medical / card / print',
  `name`        VARCHAR(100) NOT NULL COMMENT '剧情名称',
  `type`        ENUM('long','short') NOT NULL COMMENT 'long=长故事(支持存档) short=短故事(不支持存档)',
  `description` TEXT COMMENT '剧情描述',
  `badge_id`    INT COMMENT '完成后发放的勋章',
  `max_saves`   INT NOT NULL DEFAULT 5 COMMENT '最大存档数，仅长故事有意义',
  `status`      ENUM('enabled','disabled') NOT NULL DEFAULT 'enabled' COMMENT 'disabled 不下发给前端',
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_story_code` (`code`),
  KEY `idx_story_status` (`status`),
  CONSTRAINT `fk_story_badge` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='剧情定义';


-- ---------------------------------------------
-- 3. 剧情节点
--    node_key 是给前端用的业务编码（n1 / m_end），必须含阿拉伯数字：
--      - saves.js 用 parseInt(nodeId.replace(/\D/g,'')) 提取数字显示存档进度
--      - campus-story.js 读档时用 n.id === startNodeId 严格比较，而 startNodeId
--        来自 URL 参数永远是字符串，故接口必须返回字符串 node_key 而非自增 id
--    dialogue_text 用 TEXT 而非 VARCHAR：该列不建索引，不占行长度预算，
--    且无论内容策划最终限制多少字都无需 ALTER（见待澄清事项 Q-18）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `story_nodes` (
  `id`                  INT AUTO_INCREMENT PRIMARY KEY,
  `story_id`            INT NOT NULL,
  `node_key`            VARCHAR(50)  NOT NULL COMMENT '节点业务编码，如 n1 / n_end / m1',
  `dialogue_text`       TEXT         NOT NULL COMMENT '对话文案，可含换行符',
  `speaker`             VARCHAR(50)  COMMENT '说话人，前端字段名 character',
  `character_image_url` VARCHAR(255) COMMENT '人物立绘，前端字段名 characterImage',
  `bg_image_url`        VARCHAR(255) COMMENT '背景图，前端字段名 bg',
  `is_end`              BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否结束节点，触发勋章发放',
  `sort_order`          INT NOT NULL COMMENT '播放顺序，从 1 开始',
  UNIQUE KEY `uk_node_key`  (`story_id`, `node_key`),
  UNIQUE KEY `uk_node_sort` (`story_id`, `sort_order`),
  CONSTRAINT `fk_node_story` FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='剧情节点';


-- ---------------------------------------------
-- 4. 用户获得勋章
--    联合主键 (user_id, badge_id) 是勋章幂等发放的最后一道防线：
--    并发快速连点时第二次 INSERT 会被唯一约束挡下（RSK-04 缓解措施）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `user_badges` (
  `user_id`       INT NOT NULL,
  `badge_id`      INT NOT NULL,
  `story_id`      INT NOT NULL COMMENT '通过完成哪个剧情获得',
  `obtained_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `badge_id`),
  KEY `idx_ub_user` (`user_id`),
  CONSTRAINT `fk_ub_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_ub_badge` FOREIGN KEY (`badge_id`) REFERENCES `badges`(`id`)  ON DELETE CASCADE,
  CONSTRAINT `fk_ub_story` FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户勋章关系';


-- ---------------------------------------------
-- 5. 剧情完成/进度状态
--    表名依据《软件设计说明》第 3 章为 story_progress。
--    注：仓库早前的 user_story_progress 表已被本表取代，确认无数据后可执行
--        DROP TABLE IF EXISTS `user_story_progress`;
--    驱动三处功能：办事流程标记的勾/感叹号、后台剧情完成数、按钮"已完成"标记
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `story_progress` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`         INT NOT NULL,
  `story_id`        INT NOT NULL,
  `current_node_id` INT COMMENT '最近播放到的节点，可为空',
  `completed`       BOOLEAN NOT NULL DEFAULT FALSE,
  `completed_time`  DATETIME COMMENT '首次完成时间',
  UNIQUE KEY `uk_progress` (`user_id`, `story_id`),
  KEY `idx_progress_user` (`user_id`),
  CONSTRAINT `fk_sp_user` FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_sp_story` FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_node` FOREIGN KEY (`current_node_id`) REFERENCES `story_nodes`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户剧情完成记录';


-- ---------------------------------------------
-- 6. 长故事存档
--    UNIQUE(user_id, story_id, slot_index) 保证同一档位只有一条记录
--    上限 5 由 stories.max_saves 控制，后端强制（不依赖前端隐藏按钮）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `save_slots` (
  `slot_id`    INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `story_id`   INT NOT NULL,
  `node_id`    INT NOT NULL COMMENT '存档所在节点',
  `slot_index` INT NOT NULL COMMENT '档位编号 1~5，由后端自动分配最小空闲位',
  `save_time`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_slot` (`user_id`, `story_id`, `slot_index`),
  KEY `idx_slot_user_story` (`user_id`, `story_id`),
  CONSTRAINT `fk_slot_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_slot_story` FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_slot_node`  FOREIGN KEY (`node_id`)  REFERENCES `story_nodes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户存档记录';


-- ---------------------------------------------
-- 7. 办事流程地图标记
--    code 对应前端 process-select 页面标记的 data-id（medical / card / print）
--    steps 存 JSON 数组，供弹窗展示办理步骤
--    status=hidden 的标记不下发（Q-09：V1.0 隐藏一卡通与打印）
--    坐标为百分比，当前前端由 CSS 定位，此字段供后续数据驱动使用
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `process_markers` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `code`           VARCHAR(50)  NOT NULL COMMENT '前端 data-id：medical / card / print',
  `name`           VARCHAR(100) NOT NULL COMMENT '弹窗标题',
  `description`    VARCHAR(255) COMMENT '弹窗简介',
  `steps`          JSON COMMENT '办理步骤，字符串数组',
  `position_x`     DECIMAL(5,2) NOT NULL COMMENT 'X 坐标百分比',
  `position_y`     DECIMAL(5,2) NOT NULL COMMENT 'Y 坐标百分比',
  `short_story_id` INT NOT NULL COMMENT '关联的短剧情',
  `status`         ENUM('enabled','hidden') NOT NULL DEFAULT 'enabled',
  `sort_order`     INT NOT NULL DEFAULT 0,
  UNIQUE KEY `uk_marker_code` (`code`),
  KEY `idx_marker_story` (`short_story_id`),
  CONSTRAINT `fk_marker_story` FOREIGN KEY (`short_story_id`) REFERENCES `stories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='办事流程地图标记';


-- ---------------------------------------------
-- 8. 校园地图（多版本，is_active 标记当前生效版本）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `campus_maps` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(100) NOT NULL,
  `image_url`   VARCHAR(255) NOT NULL COMMENT '原样字符串，后端不做拼接',
  `version`     VARCHAR(20)  NOT NULL DEFAULT 'v1',
  `is_active`   BOOLEAN NOT NULL DEFAULT FALSE,
  `upload_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_map_name_version` (`name`, `version`),
  KEY `idx_map_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='校园地图';


-- ---------------------------------------------
-- 9. 地图查看日志（非核心业务，供统计）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `user_map_views` (
  `user_id`     INT NOT NULL,
  `map_id`      INT NOT NULL,
  `view_time`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `device_info` VARCHAR(255),
  PRIMARY KEY (`user_id`, `map_id`, `view_time`),
  CONSTRAINT `fk_mv_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_mv_map`  FOREIGN KEY (`map_id`)  REFERENCES `campus_maps`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='地图查看日志';


-- ---------------------------------------------
-- 10. 后台关键操作日志
--     导出用户 / 导出剧情必须落此表（《软件设计说明》5.5）
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `operator_id` INT COMMENT '管理员 id',
  `action`      VARCHAR(50)  NOT NULL COMMENT '如 EXPORT_USERS / EXPORT_STORIES',
  `target_type` VARCHAR(50),
  `target_id`   VARCHAR(50),
  `ip`          VARCHAR(64),
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_log_operator` (`operator_id`),
  KEY `idx_log_action` (`action`),
  CONSTRAINT `fk_log_admin` FOREIGN KEY (`operator_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台操作日志';
