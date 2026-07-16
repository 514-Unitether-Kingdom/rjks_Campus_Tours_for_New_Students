SET NAMES utf8mb4;

-- T17 大学规划(campus_plan)长·分支剧情 背景+学姐立绘。负责人：任晟达。
-- 照片/插画模糊补边；密集文字文档(二课/创新办法)浅底完整显示。
-- moren2/V1/yansu2 因首传失败被CF缓存坏响应，URL加?v=2绕缓存。

SET @sid := (SELECT id FROM stories WHERE code='campus_plan');
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_open.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_V1.png?v=2' WHERE story_id=@sid AND node_key='plan1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_open.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao2.png' WHERE story_id=@sid AND node_key='plan2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_open.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_deyi2.png' WHERE story_id=@sid AND node_key='plan3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_erke.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu2.png?v=2' WHERE story_id=@sid AND node_key='plan4';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_soft.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_wenrou2.png' WHERE story_id=@sid AND node_key='plan5';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_chuangxin.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_deyi2.png' WHERE story_id=@sid AND node_key='plan6';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_soft.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_moren2.png?v=2' WHERE story_id=@sid AND node_key='plan7';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_zonglan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu2.png' WHERE story_id=@sid AND node_key='plan_hub1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_baoyan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu2.png?v=2' WHERE story_id=@sid AND node_key='plan_by1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_baoyan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu2.png?v=2' WHERE story_id=@sid AND node_key='plan_by2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_baoyan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_deyi2.png' WHERE story_id=@sid AND node_key='plan_by3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_baoyan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='plan_by_back';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_kaoyan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='plan_ky1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_kaoyan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='plan_ky2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_kaoyan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu2.png' WHERE story_id=@sid AND node_key='plan_ky3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_kaoyan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='plan_ky_back';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_chuguo.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_wenrou2.png' WHERE story_id=@sid AND node_key='plan_ab1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_chuguo.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_wenrou2.png' WHERE story_id=@sid AND node_key='plan_ab2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_chuguo.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_beishou2.png' WHERE story_id=@sid AND node_key='plan_ab3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_chuguo.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_wenrou2.png' WHERE story_id=@sid AND node_key='plan_ab_back';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_jiuye.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_deyi2.png' WHERE story_id=@sid AND node_key='plan_job1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_jiuye.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_deyi2.png' WHERE story_id=@sid AND node_key='plan_job2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_jiuye.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao2.png' WHERE story_id=@sid AND node_key='plan_job3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_jiuye.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_deyi2.png' WHERE story_id=@sid AND node_key='plan_job_back';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_zonglan.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_moren2.png?v=2' WHERE story_id=@sid AND node_key='plan_end1';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_library.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_V1.png?v=2' WHERE story_id=@sid AND node_key='plan_end2';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_library.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_deyi2.png' WHERE story_id=@sid AND node_key='plan_end3';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_library.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_chayao3.png' WHERE story_id=@sid AND node_key='plan_end4';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_library.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_nashu2.png' WHERE story_id=@sid AND node_key='plan_end5';
UPDATE story_nodes SET bg_image_url='https://ai.tanxiaozhilv.uk/story-bg/plan_soft.jpg', character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_beishou2.png' WHERE story_id=@sid AND node_key='plan_end6';

-- card 补回真 yansu2(带?v=2)
SET @cid := (SELECT id FROM stories WHERE code='card');
UPDATE story_nodes SET character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu2.png?v=2' WHERE story_id=@cid AND node_key='card2';
UPDATE story_nodes SET character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu2.png?v=2' WHERE story_id=@cid AND node_key='card5';
UPDATE story_nodes SET character_image_url='https://ai.tanxiaozhilv.uk/story-bg/ll_xj_yansu2.png?v=2' WHERE story_id=@cid AND node_key='card9';
