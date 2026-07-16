-- 强制 utf8mb4
SET NAMES utf8mb4;

-- =============================================================
-- 探校之旅 —— T14《浏览校园》通用背景 + 多姿势学姐立绘
-- 负责人：任晟达（后端 B）
-- 背景：仍用包内 /images/ 占位图的节点（开场/选择/学院/结束/暂无实拍照的地点）
--   全部换成服务器通用背景 campus_generic.jpg（礼堂+蓝天，裁竖版）——包内那张 3.6MB 大图
--   在真机上解不动/显示不全，换成服务器小图（237KB）真机才正常。有专属实拍照的节点(T13)不动。
-- 人物：按节点内容给不同姿势学姐立绘（挥手/温柔/叉腰/拿书/得意/默认），都在 /story-bg/。
-- 依赖：t9 建 campus 节点、t13 已换实拍背景 + app.js 已托管 /story-bg。可重复执行。
-- =============================================================

-- 1) 通用背景：还在用包内 /images/ 的 campus 节点 → 服务器通用背景
UPDATE story_nodes
   SET bg_image_url = 'https://ai.tanxiaozhilv.uk/story-bg/campus_generic.jpg'
 WHERE story_id = (SELECT id FROM stories WHERE code = 'campus')
   AND bg_image_url LIKE '/images/%';

-- 2) 人物：按节点内容分配不同姿势立绘
UPDATE story_nodes
   SET character_image_url = CONCAT('https://ai.tanxiaozhilv.uk/story-bg/',
     CASE
       WHEN node_key = 'life_welcome_scene' THEN 'xj_huishuo'          -- 开场欢迎：挥手
       WHEN node_key = 'campus_end'         THEN 'xj_wenrou'           -- 结束告别：温柔
       WHEN node_type = 'choice'            THEN 'xj_chayao'           -- 选择/提问：叉腰
       WHEN node_key LIKE 'study_%' OR node_key LIKE 'major_%' THEN 'xj_nashu'  -- 学习区/学院：拿书讲学
       WHEN node_key LIKE 'sport_%'         THEN 'xj_deyi'             -- 运动区：得意活力
       WHEN node_key LIKE 'life_%'          THEN 'xj_wenrou'           -- 生活区：温柔亲切
       ELSE 'xj_moren'                                                 -- 兜底：默认
     END, '.png')
 WHERE story_id = (SELECT id FROM stories WHERE code = 'campus');
