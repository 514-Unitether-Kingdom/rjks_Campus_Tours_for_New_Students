-- 强制 utf8mb4，防 Windows mysql 客户端 GBK 乱码
SET NAMES utf8mb4;

-- =============================================================
-- 探校之旅 —— T13《浏览校园》换真实背景 + 学姐立绘
-- 负责人：任晟达（后端 B）
-- 背景照按地点实拍（juqing_ziyuan/liulan-long/建筑/），压缩后放服务器 public/story-bg/，
--   文件按 location_id 命名（如 olympic_restaurant.jpg），经 HTTPS 托管。
-- 人物用抠好绿幕的学姐立绘 xuejie.png（透明 PNG）。
-- 只更新有实拍照片的地点；宿舍等暂无照片的节点保持原背景不动，后续补。
-- 依赖：t9 已建 campus 节点（含 location_id）。可重复执行。
-- =============================================================

-- 1) 背景：给有实拍照的地点节点（scene + map 都换），按 location_id 拼服务器地址
UPDATE story_nodes
   SET bg_image_url = CONCAT('https://ai.tanxiaozhilv.uk/story-bg/', location_id, '.jpg')
 WHERE story_id = (SELECT id FROM stories WHERE code = 'campus')
   AND location_id IN (
     'no1_teaching_building','no2_teaching_building','no3_teaching_building','no4_teaching_building',
     'olympic_restaurant','food_court','express_station','school_hospital',
     'north_sports_ground','south_sports_ground','basketball_volleyball_courts','tennis_courts',
     'olympic_venue','table_tennis_hall','swimming_pool','library',
     'humanities_building','practice_training_building','information_building','information_building_east',
     'student_service_center'
   );

-- 2) 人物：浏览校园全程用学姐立绘（透明 PNG，前端 aspectFit 显示在右下角）
UPDATE story_nodes
   SET character_image_url = 'https://ai.tanxiaozhilv.uk/story-bg/xuejie.png'
 WHERE story_id = (SELECT id FROM stories WHERE code = 'campus');
