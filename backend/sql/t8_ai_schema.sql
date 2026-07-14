-- 强制本次会话使用 utf8mb4，防 Windows mysql 客户端 GBK 乱码。
SET NAMES utf8mb4;

-- =============================================
-- 探校之旅 —— T8 AI 新生助手：知识库 + 问答记录
-- 负责人：任晟达（后端 B）
-- 依赖：Script.sql -> t7_schema.sql
-- 本脚本可重复执行。
-- =============================================

-- ---------------------------------------------
-- 知识库：AI 回答学校问题的唯一事实来源。
-- 检索用 MySQL 8 的 ngram 全文索引（对中文分词），不靠 LIKE。
-- status=draft 的条目不参与检索（草稿/待核实）。
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `kb_entries` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `category`   VARCHAR(50)  NOT NULL COMMENT '分类：app_usage/办事流程/地点/电话/时间/找谁办/其他',
  `question`   VARCHAR(255) NOT NULL COMMENT '问题或主题（用户会怎么问）',
  `answer`     TEXT         NOT NULL COMMENT '准确、简洁的答案',
  `keywords`   VARCHAR(255) NOT NULL DEFAULT '' COMMENT '补充检索关键词，空格分隔',
  `contact`    VARCHAR(255) NOT NULL DEFAULT '' COMMENT '相关电话/地点/时间',
  `source`     VARCHAR(255) NOT NULL DEFAULT '' COMMENT '来源（官网/新生手册/某部门）',
  `images`     JSON         NULL COMMENT '配图，按原文顺序 [{"url":"/kb-images/x.jpg","desc":"图注"}]，无图为 NULL',
  `status`     ENUM('enabled','draft') NOT NULL DEFAULT 'enabled' COMMENT 'draft 不参与检索',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_kb_cat` (`category`),
  KEY `idx_kb_status` (`status`),
  FULLTEXT KEY `ft_kb` (`question`, `answer`, `keywords`) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI助手知识库';


-- ---------------------------------------------
-- 问答记录：每次提问都落库，供后台查看、点赞点踩、沉淀成新知识。
-- answered_by: ai=模型答 / fallback=模型挂了退回资料 / blocked=被内容审核拦 / error=失败
-- feedback: 1赞 -1踩 0未评
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS `qa_records` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT COMMENT '提问用户',
  `session_id`  VARCHAR(64) COMMENT '多轮对话归组',
  `question`    VARCHAR(1000) NOT NULL,
  `answer`      MEDIUMTEXT,
  `images`      JSON         NULL COMMENT '本次回答展示的配图 [{"url","desc"}]，无图为 NULL',
  `sources`     VARCHAR(500) NOT NULL DEFAULT '' COMMENT '引用的资料来源',
  `category`    VARCHAR(50)  NOT NULL DEFAULT '',
  `answered_by` VARCHAR(20)  NOT NULL DEFAULT 'ai',
  `feedback`    TINYINT NOT NULL DEFAULT 0 COMMENT '1赞 -1踩 0未评',
  `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_qa_user` (`user_id`),
  KEY `idx_qa_session` (`session_id`),
  KEY `idx_qa_created` (`created_at`),
  CONSTRAINT `fk_qa_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI助手问答记录';
