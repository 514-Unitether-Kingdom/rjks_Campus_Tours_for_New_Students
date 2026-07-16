SET NAMES utf8mb4;

-- T19 勋章清理：删除悬空的"打印能手"(badge_print，其剧情 print 已停用无法获得)；
-- 食堂/运动时间徽章改用各自专属图标(原借用 badge_campus.png 占位)。负责人：任晟达。
-- 依赖前端 PR 同步补齐 /images 下新图标 + 去掉 badges.js 灰图硬编码。

-- 1) 删除打印能手徽章（stories.badge_id 外键 SET NULL、user_badges CASCADE，安全）
DELETE FROM badges WHERE code = 'badge_print';

-- 2) 食堂/运动时间徽章指向专属图标
UPDATE badges SET icon_url = '/images/badge_canteen_time.png' WHERE code = 'badge_canteen_time';
UPDATE badges SET icon_url = '/images/badge_sports_time.png'  WHERE code = 'badge_sports_time';
