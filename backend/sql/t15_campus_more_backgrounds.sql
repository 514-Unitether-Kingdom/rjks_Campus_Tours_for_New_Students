-- 强制 utf8mb4，防 Windows mysql 客户端 GBK 乱码
SET NAMES utf8mb4;

-- =============================================================
-- 探校之旅 —— T15《浏览校园》补充实拍背景 + 背景显示优化
-- 负责人：任晟达（后端 B）
-- 承接 t13/t14：
--   1) 学院楼/宿舍/校门补实拍照（此前用通用背景 campus_generic 兜底的一批）。
--   2) 背景显示优化：礼堂通用背景 + 新实拍图都重制为「竖版画布 + 模糊补边」
--      （主体缩小、完整显示、居中偏上避开对话框），解决 aspectFill 裁剪导致的
--      「只见天空 / 主体太大显示不全」。图片内容变了但文件名不变，故 URL 加 ?v=2
--      绕开 Cloudflare 7 天边缘缓存（同名覆盖不会自动更新）。以后再改图 → 升 v3。
-- 图已压缩(<400KB)放 backend/public/story-bg/，按 location_id 命名，经 HTTPS 托管。
-- 依赖：t9 建 campus 节点 + t13/t14 已跑 + app.js 已托管 /story-bg。可重复执行。
-- =============================================================

-- 1) 单地点节点：按 location_id 拼服务器地址 + ?v=2 绕缓存（同 t13 规则）
UPDATE story_nodes
   SET bg_image_url = CONCAT('https://ai.tanxiaozhilv.uk/story-bg/', location_id, '.jpg?v=2')
 WHERE story_id = (SELECT id FROM stories WHERE code = 'campus')
   AND location_id IN (
     'material_building','urban_construction_building','environment_energy_building',
     'physical_science_building','energy_building','art_building','software_building',
     'goldworking_building','east_dormitories','northeast_dormitories'
   );

-- 2) 西门：该节点 location_id 是逗号拼的多地点，显式指定文件名。
UPDATE story_nodes
   SET bg_image_url = 'https://ai.tanxiaozhilv.uk/story-bg/campus_west_gate.jpg?v=2'
 WHERE story_id = (SELECT id FROM stories WHERE code = 'campus')
   AND location_id = 'campus_west_gate,campus_west_side_gate';

-- 3) 礼堂通用背景：内容重制过，同样加 ?v=2 让端上取新图（匹配 t14 设过的那批节点）。
UPDATE story_nodes
   SET bg_image_url = 'https://ai.tanxiaozhilv.uk/story-bg/campus_generic.jpg?v=2'
 WHERE story_id = (SELECT id FROM stories WHERE code = 'campus')
   AND bg_image_url = 'https://ai.tanxiaozhilv.uk/story-bg/campus_generic.jpg';
