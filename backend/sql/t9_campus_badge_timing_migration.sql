-- 《浏览校园》子任务徽章发放时机修正。
-- 适用于已经执行过 t9_campus_story_seed.sql 的数据库；不会重置剧情节点或用户进度。

SET @campus_id := (SELECT id FROM stories WHERE code='campus');

-- 清除旧的“进入分区即发放”标记。
UPDATE story_nodes
SET grants_badge=NULL
WHERE story_id=@campus_id
  AND grants_badge IN ('badge_canteen_time', 'badge_sports_time');

-- 生活区：完成食堂、快递、校医院等内容，到达分支选择页后才发放。
UPDATE story_nodes
SET grants_badge='badge_canteen_time'
WHERE story_id=@campus_id AND node_key='choose_interest';

-- 运动区：走完全部场馆，到达结束选择页后才发放。
UPDATE story_nodes
SET grants_badge='badge_sports_time'
WHERE story_id=@campus_id AND node_key='sport_end_choice';
