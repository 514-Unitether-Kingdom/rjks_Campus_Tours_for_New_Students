-- 强制 utf8mb4
SET NAMES utf8mb4;

-- =============================================================
-- 探校之旅 —— T16 短剧情背景+学姐立绘（补办校园卡/境外交流/选课）
-- 负责人：任晟达（后端 B）。按组员剧情文档逐幕指定：风景照做模糊补边、
-- 流程图/文档做浅底完整显示；学姐立绘按每幕表情。均为新文件名，无需 ?v。
-- ⚠ ll_xj_yansu2 素材缺失，card 中该表情暂用 ll_xj_yansu1 顶替。
-- 依赖：t11 建 card/overseas_exchange/course_select 节点 + app.js 托管 /story-bg。可重复执行。
-- =============================================================

-- ===== card =====
SET @sid := (SELECT id FROM stories WHERE code='card');
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_campus.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='card1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_campus.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu1.png' WHERE story_id=@sid AND node_key='card2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_xiaofei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_wenrou2.png' WHERE story_id=@sid AND node_key='card3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_xiaofei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_wenrou2.png' WHERE story_id=@sid AND node_key='card4';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_xiaofei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu1.png' WHERE story_id=@sid AND node_key='card5';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_xiaofei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_beishou2.png' WHERE story_id=@sid AND node_key='card6';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_xiaofei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao1.png' WHERE story_id=@sid AND node_key='card7';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_buban.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu1.png' WHERE story_id=@sid AND node_key='card8';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_buban.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu1.png' WHERE story_id=@sid AND node_key='card9';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_buban.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_beishou2.png' WHERE story_id=@sid AND node_key='card10';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_xianchang.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_beishou2.png' WHERE story_id=@sid AND node_key='card11';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_xianchang.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu2.png' WHERE story_id=@sid AND node_key='card12';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_xianchang.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu2.png' WHERE story_id=@sid AND node_key='card13';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/card_campus.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_huimou1.png' WHERE story_id=@sid AND node_key='card_end';

-- ===== overseas_exchange =====
SET @sid := (SELECT id FROM stories WHERE code='overseas_exchange');
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_library.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_beishou1.png' WHERE story_id=@sid AND node_key='ov1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_library.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='ov2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_library.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu1.png' WHERE story_id=@sid AND node_key='ov3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu1.png' WHERE story_id=@sid AND node_key='ov4';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu1.png' WHERE story_id=@sid AND node_key='ov5';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_wenrou1.png' WHERE story_id=@sid AND node_key='ov6';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_beishou2.png' WHERE story_id=@sid AND node_key='ov7';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu1.png' WHERE story_id=@sid AND node_key='ov8';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu1.png' WHERE story_id=@sid AND node_key='ov9';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_xiuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu2.png' WHERE story_id=@sid AND node_key='ov10';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_xiuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu1.png' WHERE story_id=@sid AND node_key='ov11';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_xiuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu1.png' WHERE story_id=@sid AND node_key='ov12';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_xiuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_beishou2.png' WHERE story_id=@sid AND node_key='ov13';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_xiuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_wenrou1.png' WHERE story_id=@sid AND node_key='ov14';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_fuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu1.png' WHERE story_id=@sid AND node_key='ov15';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_fuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu1.png' WHERE story_id=@sid AND node_key='ov16';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_fuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu1.png' WHERE story_id=@sid AND node_key='ov17';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_fuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='ov18';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_fuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='ov19';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/ov_fuxue.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_huishuo1.png' WHERE story_id=@sid AND node_key='ov_end';

-- ===== course_select =====
SET @sid := (SELECT id FROM stories WHERE code='course_select');
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_campus.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_beishou1.png' WHERE story_id=@sid AND node_key='cs1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_campus.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_chayao1.png' WHERE story_id=@sid AND node_key='cs2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_zhonglei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_yansu2.png' WHERE story_id=@sid AND node_key='cs3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_zhonglei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_wenrou1.png' WHERE story_id=@sid AND node_key='cs4';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_zhonglei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_wenrou1.png' WHERE story_id=@sid AND node_key='cs5';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_zhonglei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_wenrou1.png' WHERE story_id=@sid AND node_key='cs6';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_zhonglei.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_beishou1.png' WHERE story_id=@sid AND node_key='cs7';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_deyi2.png' WHERE story_id=@sid AND node_key='cs8';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_yansu2.png' WHERE story_id=@sid AND node_key='cs9';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_deyi2.png' WHERE story_id=@sid AND node_key='cs10';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_yansu2.png' WHERE story_id=@sid AND node_key='cs11';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_yansu2.png' WHERE story_id=@sid AND node_key='cs12';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_wenrou1.png' WHERE story_id=@sid AND node_key='cs13';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_liucheng.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_wenrou1.png' WHERE story_id=@sid AND node_key='cs14';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_chaxun.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_chayao1.png' WHERE story_id=@sid AND node_key='cs15';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_chaxun.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_yansu1.png' WHERE story_id=@sid AND node_key='cs16';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/cs_chaxun.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/yj_xj_V2.png' WHERE story_id=@sid AND node_key='cs_end';
