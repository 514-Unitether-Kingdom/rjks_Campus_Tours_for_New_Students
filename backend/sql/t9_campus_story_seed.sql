-- 强制 utf8mb4，防 Windows mysql 客户端 GBK 乱码。
SET NAMES utf8mb4;

-- =============================================================
-- 探校之旅 —— T9《浏览校园》v2 剧情内容（地点地图 + 分支 + 专业路线 + 时间徽章）
-- 负责人：任晟达（后端 B）
--
-- 依赖：Script.sql -> t7_schema.sql -> t7_seed.sql（需已建 campus 剧情）
-- 本文件自带幂等的字段补全，可独立执行、可重复执行。
--
-- 学院/专业口径、食堂/运动开放时间：均以「工大百科知识库」为准。
-- 楼宇方位文案：取自《分区与设定》表2 + frontend/utils/campus-map.js 坐标。
--
-- ⚠ 前端翻页机制（campus-story.js）：普通页按 sort_order 线性前进，
--   只有 node_type='choice' 节点能拦住并按 targetNodeId 跳转。
--   故每段支线结尾都用 choice 收口，campus_end 为唯一 is_end=1 节点。
-- =============================================================

-- ---------- 0. 幂等补全字段（已存在则跳过）----------
SET @db := DATABASE();

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db AND TABLE_NAME='story_nodes' AND COLUMN_NAME='location_id');
SET @sql := IF(@exist=0,
  "ALTER TABLE story_nodes ADD COLUMN location_id VARCHAR(64) NULL COMMENT '剧情地图地点 ID，见 campus-map.js'",
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db AND TABLE_NAME='story_nodes' AND COLUMN_NAME='node_type');
SET @sql := IF(@exist=0,
  "ALTER TABLE story_nodes ADD COLUMN node_type ENUM('scene','map','choice') NOT NULL DEFAULT 'scene' COMMENT '剧情页类型'",
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db AND TABLE_NAME='story_nodes' AND COLUMN_NAME='choices_json');
SET @sql := IF(@exist=0,
  "ALTER TABLE story_nodes ADD COLUMN choices_json JSON NULL COMMENT '分支选项 [{text,targetNodeId,requiresMajor,targetByCollege}]'",
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db AND TABLE_NAME='badges' AND COLUMN_NAME='detail');
SET @sql := IF(@exist=0,
  "ALTER TABLE badges ADD COLUMN detail TEXT NULL COMMENT '徽章详情长文（如时间徽章的全部开放时间/价格）'",
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- grants_badge：完成对应分区后到达该节点时，前端调 POST /api/badges/obtain 领取的徽章 code。
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@db AND TABLE_NAME='story_nodes' AND COLUMN_NAME='grants_badge');
SET @sql := IF(@exist=0,
  "ALTER TABLE story_nodes ADD COLUMN grants_badge VARCHAR(50) NULL COMMENT '到达完成节点后发放的徽章 code'",
  'DO 0');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------- 1. 定位 campus 剧情，删除旧的 6 个占位节点 ----------
SET @campus_id := (SELECT id FROM stories WHERE code='campus');
-- 存档指向旧节点会被 FK 级联删除（测试数据，可接受）。
DELETE FROM story_nodes WHERE story_id=@campus_id;

-- 统一素材（map 组件按 location_id 覆盖高亮，bg 仅兜底）
SET @char := '/images/character_xuejie.png';
SET @bg   := '/images/story_bg1.jpg';

-- ---------- 2. 生活区（线性，scene/map 交替）----------
INSERT INTO story_nodes
 (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, location_id, node_type, choices_json, is_end, sort_order)
VALUES
(@campus_id,'life_welcome_scene','欢迎来到北京工业大学平乐园校区！我是你的向导学姐。','学姐',@char,@bg,NULL,'scene',NULL,0,1),
(@campus_id,'life_gate_scene','先记住几个校门：东南西北四个大门，加上东南小门、西侧小门——迷路时找校门或体育场，方向就能重新对上；西侧小门离地铁近，但只走行人。','学姐',@char,@bg,NULL,'scene',NULL,0,2),
(@campus_id,'life_gate_west_map','先看校园西侧：闪烁区域分别是西门和西侧小门。西侧小门离地铁更近，但只供行人通行。','学姐',@char,@bg,'campus_west_gate,campus_west_side_gate','map',NULL,0,3),
(@campus_id,'life_gate_northeast_map','再看北门和东门：北门正对校医院方向，东门在校园东侧，都是辨认方向的重要地标。','学姐',@char,@bg,'campus_north_gate,campus_east_gate','map',NULL,0,4),
(@campus_id,'life_gate_southeast_map','最后看南门和东南门：它们位于校园南侧，去南部教学区和生活区时很常用。','学姐',@char,@bg,'campus_south_gate,campus_southeast_gate','map',NULL,0,5),
(@campus_id,'life_north_dorm_scene','先带你认认宿舍区。北区是 01 到 04 号楼，离学生综合服务中心很近。先把楼号、单元和门禁位置记牢，早八才不会手忙脚乱。','学姐',@char,@bg,'north_dormitories','scene',NULL,0,3),
(@campus_id,'life_north_dorm_map','看这片闪烁的金色区域，它就是北区宿舍（01–04 号楼）；从学生综合服务中心出发，很快就能找到入口。','学姐',@char,@bg,'north_dormitories','map',NULL,0,4),
(@campus_id,'life_northeast_dorm_scene','东北区是 10、11 号楼，靠近北部教学区和北体育场。出门前预留十分钟，顺路熟悉银杏大道。','学姐',@char,@bg,'northeast_dormitories','scene',NULL,0,5),
(@campus_id,'life_northeast_dorm_map','看这片闪烁的金色区域，它就是东北区宿舍（10、11 号楼）；从北体育场出发，很快就能找到入口。','学姐',@char,@bg,'northeast_dormitories','map',NULL,0,6),
(@campus_id,'life_east_dorm_scene','东区是 13、14 号楼，靠近能源楼和北体育场。晚归时走照明充分的主路，也别忘了门禁时间。','学姐',@char,@bg,'east_dormitories','scene',NULL,0,7),
(@campus_id,'life_east_dorm_map','看这片闪烁的金色区域，它就是东区宿舍（13、14 号楼）；从北体育场出发，很快就能找到入口。','学姐',@char,@bg,'east_dormitories','map',NULL,0,8),
(@campus_id,'life_central_dorm_scene','中部是 07 到 12 号楼，是生活区的中转站，去图书馆、食堂和南体育场都很顺路。','学姐',@char,@bg,'central_dormitories','scene',NULL,0,9),
(@campus_id,'life_central_dorm_map','看这片闪烁的金色区域，它就是中区宿舍（07–12 号楼）；从图书馆出发，很快就能找到入口。','学姐',@char,@bg,'central_dormitories','map',NULL,0,10),
(@campus_id,'life_south_dorm_scene','南区是 05、06 号楼，靠近南部教学区和奥林匹克体育馆，沿博雅路可以慢慢认清人文楼和科学楼。','学姐',@char,@bg,'south_dormitories','scene',NULL,0,11),
(@campus_id,'life_south_dorm_map','看这片闪烁的金色区域，它就是南区宿舍（05、06 号楼）；从奥林匹克体育馆出发，很快就能找到入口。','学姐',@char,@bg,'south_dormitories','map',NULL,0,12),
(@campus_id,'life_service_center_scene','这栋是学生综合服务楼。北区食堂、民族食堂、天天餐厅都在这一带，第一次来先认认楼层。它们的开放时间我整理进了「食堂时间徽章」，逛完点开就能看。','学姐',@char,@bg,'student_service_center','scene',NULL,0,13),
(@campus_id,'life_service_center_map','看这片闪烁的金色区域，它就是学生综合服务楼；从北区宿舍出发，很快就能找到入口。','学姐',@char,@bg,'student_service_center','map',NULL,0,14),
(@campus_id,'life_olympic_rest_scene','奥运餐厅在 12 号宿舍楼南侧。赶课时优先选离自己最近的食堂，别为吃什么耽误上课。','学姐',@char,@bg,'olympic_restaurant','scene',NULL,0,15),
(@campus_id,'life_olympic_rest_map','看这片闪烁的金色区域，它就是奥运餐厅；从南区宿舍出发，很快就能找到入口。','学姐',@char,@bg,'olympic_restaurant','map',NULL,0,16),
(@campus_id,'life_food_court_scene','美食园、风味餐厅、教工餐厅还有天天咖啡厅集中在餐饮综合楼一带。提醒一下：天天餐厅和天天咖啡厅是两个不同的地方哦。晚自习前想补给能量可以来看看。','学姐',@char,@bg,'food_court','scene',NULL,0,17),
(@campus_id,'life_food_court_map','看这片闪烁的金色区域，它就是美食园（餐饮综合楼）；从奥运餐厅出发，很快就能找到入口。','学姐',@char,@bg,'food_court','map',NULL,0,18),
(@campus_id,'life_express_scene','快递驿站在北侧田径场和游泳馆之间、游泳馆后面。快递地址统一填：北京市朝阳区南磨房镇平乐园100号。快递柜 24 小时开，驿站 9:00–19:00。','学姐',@char,@bg,'express_station','scene',NULL,0,19),
(@campus_id,'life_express_map','看这片闪烁的金色区域，它就是快递驿站；从游泳馆出发，很快就能找到入口。','学姐',@char,@bg,'express_station','map',NULL,0,20),
(@campus_id,'life_hospital_scene','校医院就在北门门口。关注公众号「北京工业大学医院」就能预约挂号，到院凭一卡通签到就诊；不舒服时别硬撑，尽早来看看。','学姐',@char,@bg,'school_hospital','scene',NULL,0,21),
(@campus_id,'life_hospital_map','看这片闪烁的金色区域，它就是校医院；从北门出发，很快就能找到入口。','学姐',@char,@bg,'school_hospital','map',NULL,0,22),
(@campus_id,'choose_interest','生活区先逛到这。接下来想先去哪边？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"先去学习区看看","targetNodeId":"study_profile_gate"},{"text":"先去运动区转转","targetNodeId":"sport_north_scene"}]',0,23);

-- ---------- 3. 运动区（线性）----------
INSERT INTO story_nodes
 (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, location_id, node_type, choices_json, is_end, sort_order)
VALUES
(@campus_id,'sport_north_scene','北体育场是北部最醒目的方向参照，全天开放。经过训练场地时，记得给上课和校队训练留出空间。各场馆详细的开放时间和价格，我整理进了「运动时间徽章」。','学姐',@char,@bg,'north_sports_ground','scene',NULL,0,24),
(@campus_id,'sport_north_map','看这片闪烁的金色区域，它就是北体育场；从北区宿舍出发，很快就能找到入口。','学姐',@char,@bg,'north_sports_ground','map',NULL,0,25),
(@campus_id,'sport_south_scene','南体育场也免费开放。跑步前先看有没有教学、比赛或大型活动安排。','学姐',@char,@bg,'south_sports_ground','scene',NULL,0,26),
(@campus_id,'sport_south_map','看这片闪烁的金色区域，它就是南体育场；从奥运餐厅出发，很快就能找到入口。','学姐',@char,@bg,'south_sports_ground','map',NULL,0,27),
(@campus_id,'sport_ballcourt_scene','篮球场、排球场在南操场南侧、奥运餐厅东南侧，每天 6:00–20:00。热门时段建议提前约同学，实际可用以预约小程序为准。','学姐',@char,@bg,'basketball_volleyball_courts','scene',NULL,0,28),
(@campus_id,'sport_ballcourt_map','看这片闪烁的金色区域，它就是篮球场、排球场；从南体育场出发，很快就能找到入口。','学姐',@char,@bg,'basketball_volleyball_courts','map',NULL,0,29),
(@campus_id,'sport_tennis_scene','网球场在南操场北侧，每天 6:00–20:00。校内外收费不同，练球前先确认预约和当天规则。','学姐',@char,@bg,'tennis_courts','scene',NULL,0,30),
(@campus_id,'sport_tennis_map','看这片闪烁的金色区域，它就是网球场；从南体育场出发，很快就能找到入口。','学姐',@char,@bg,'tennis_courts','map',NULL,0,31),
(@campus_id,'sport_gym_scene','奥林匹克体育馆里有健身房（北 4 口，正对人文楼东门）和羽毛球馆（一层北一门进）。两处都要留意预约和开放时间。','学姐',@char,@bg,'olympic_venue','scene',NULL,0,32),
(@campus_id,'sport_gym_map','看这片闪烁的金色区域，它就是奥林匹克体育馆；从南区宿舍出发，很快就能找到入口。','学姐',@char,@bg,'olympic_venue','map',NULL,0,33),
(@campus_id,'sport_pingpong_scene','乒乓球馆在南田径场看台下、南操场西侧地下一层，有 23 张专业球台。认准地图上的红色不规则长条，就不会绕圈。','学姐',@char,@bg,'table_tennis_hall','scene',NULL,0,34),
(@campus_id,'sport_pingpong_map','看这片闪烁的金色区域，它就是乒乓球馆；从南体育场出发，很快就能找到入口。','学姐',@char,@bg,'table_tennis_hall','map',NULL,0,35),
(@campus_id,'sport_swim_scene','游泳馆在北体育场西侧。首次游泳健身要带体检表；每场次 1.5 小时，注意清场时间。','学姐',@char,@bg,'swimming_pool','scene',NULL,0,36),
(@campus_id,'sport_swim_map','看这片闪烁的金色区域，它就是游泳馆；从北体育场出发，很快就能找到入口。','学姐',@char,@bg,'swimming_pool','map',NULL,0,37),
(@campus_id,'sport_underground_scene','地下训练馆在游泳馆北侧，有篮球、排球场地，但会优先保障课程和校队训练。','学姐',@char,@bg,'underground_training_hall','scene',NULL,0,38),
(@campus_id,'sport_underground_map','看这片闪烁的金色区域，它就是地下训练馆；从游泳馆出发，很快就能找到入口。','学姐',@char,@bg,'underground_training_hall','map',NULL,0,39),
(@campus_id,'sport_end_choice','运动区就逛到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去看看学习区","targetNodeId":"study_profile_gate"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,40);

-- ---------- 4. 学习区入口（分支，专业路线）----------
-- targetByCollege 关键词已做互斥设计（每个学生资料至多命中一个键），
-- 不依赖键顺序（MySQL JSON 会重排 key，故绝不能依赖顺序）。
INSERT INTO story_nodes
 (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, location_id, node_type, choices_json, is_end, sort_order)
VALUES
(@campus_id,'study_profile_gate','学习区的楼很多，我按你的专业带你走，只逛跟你相关的学院楼。','学姐',@char,@bg,NULL,'choice',
 '[{"text":"按我的专业继续","requiresMajor":true,"targetNodeId":"study_library_scene","targetByCollege":{"计算机":"major_cs_scene","物联网":"major_cs_scene","软件":"major_cs_scene","信息安全":"major_cs_scene","信息科学技术":"major_infosci_scene","人工智能":"major_infosci_scene","电子信息":"major_infosci_scene","通信":"major_infosci_scene","自动化":"major_infosci_scene","机械":"major_mech_scene","智能制造":"major_mech_scene","材料":"major_material_scene","建筑工程":"major_civileng_scene","土木":"major_civileng_scene","给排水":"major_civileng_scene","智能建造":"major_civileng_scene","建筑环境":"major_civileng_scene","城市规划":"major_archurban_scene","城乡规划":"major_archurban_scene","建筑学":"major_archurban_scene","交通":"major_traffic_scene","数学":"major_mathstat_scene","力学":"major_mathstat_scene","统计":"major_mathstat_scene","数据科学":"major_mathstat_scene","物理":"major_physics_scene","光电":"major_physics_scene","生命科学":"major_lifesci_scene","生物":"major_lifesci_scene","环境工程":"major_environ_scene","环境科学":"major_environ_scene","经济":"major_econ_scene","管理":"major_econ_scene","金融":"major_econ_scene","会计":"major_econ_scene","法学":"major_econ_scene","社会":"major_econ_scene","外国语":"major_foreign_scene","英语":"major_foreign_scene","艺术":"major_art_scene","设计":"major_art_scene"}},{"text":"先看通用学习路线","targetNodeId":"study_library_scene"}]',0,41);

-- ---------- 5. 通用学习路线（图书馆 + 四教，线性）----------
INSERT INTO story_nodes
 (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, location_id, node_type, choices_json, is_end, sort_order)
VALUES
(@campus_id,'study_library_scene','图书馆大致每天 7:30–22:30 开放，凭一卡通进入；不同区域规则可直接问工作人员。资源紧张时，也能上教务系统查空教室自习。','学姐',@char,@bg,'library','scene',NULL,0,42),
(@campus_id,'study_library_map','看这片闪烁的金色区域，它就是图书馆；从知新园出发，很快就能找到入口。','学姐',@char,@bg,'library','map',NULL,0,43),
(@campus_id,'study_teach1_scene','一教靠近北体育场西侧，数理和部分理工课常在这里。上课前确认教室号，别只看楼名。','学姐',@char,@bg,'no1_teaching_building','scene',NULL,0,44),
(@campus_id,'study_teach1_map','看这片闪烁的金色区域，它就是第一教学楼；从北体育场往西走，很快就能找到入口。','学姐',@char,@bg,'no1_teaching_building','map',NULL,0,45),
(@campus_id,'study_teach2_scene','二教和一教相连，材料楼在南侧；赶课时预留上下楼和找教室的时间。','学姐',@char,@bg,'no2_teaching_building','scene',NULL,0,46),
(@campus_id,'study_teach2_map','看这片闪烁的金色区域，它就是第二教学楼；从第一教学楼出发，很快就能找到入口。','学姐',@char,@bg,'no2_teaching_building','map',NULL,0,47),
(@campus_id,'study_teach3_scene','三教在图书馆东北侧，是许多专业都会用到的公共教学楼。','学姐',@char,@bg,'no3_teaching_building','scene',NULL,0,48),
(@campus_id,'study_teach3_map','看这片闪烁的金色区域，它就是第三教学楼；从图书馆出发，很快就能找到入口。','学姐',@char,@bg,'no3_teaching_building','map',NULL,0,49),
(@campus_id,'study_teach4_scene','四教靠近南体育场，文科和艺术类课程较常出现，也可顺路熟悉艺术广场。','学姐',@char,@bg,'no4_teaching_building','scene',NULL,0,50),
(@campus_id,'study_teach4_map','看这片闪烁的金色区域，它就是第四教学楼；从南体育场出发，很快就能找到入口。','学姐',@char,@bg,'no4_teaching_building','map',NULL,0,51),
(@campus_id,'study_generic_end_choice','通用路线就到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,52);

-- ---------- 6. 各学院专属路线（14 条，每条：入口 scene + 逐楼 map + 段尾 choice 收口）----------
-- 段尾 choice 统一：再去运动场 / 结束本次浏览。共用楼在不同学院各建一份节点。
INSERT INTO story_nodes
 (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, location_id, node_type, choices_json, is_end, sort_order)
VALUES
-- 计算机学院
(@campus_id,'major_cs_scene','作为计算机学院的同学，你常去的是实训楼、信息楼和软件楼；另外三教、四教是公用教学楼，很多课都在那儿上。先带你认认自己学院的楼。','学姐',@char,@bg,NULL,'scene',NULL,0,53),
(@campus_id,'major_cs_shixun_map','看这片闪烁的金色区域，它就是实训楼；在环能楼东南、月亮湖东侧。','学姐',@char,@bg,'practice_training_building','map',NULL,0,54),
(@campus_id,'major_cs_info_map','看这片闪烁的金色区域，它就是信息楼；从图书馆往西、秋实路东侧就到。','学姐',@char,@bg,'information_building','map',NULL,0,55),
(@campus_id,'major_cs_software_map','看这片闪烁的金色区域，它就是软件楼；在环能楼东南、月亮湖东侧。','学姐',@char,@bg,'software_building','map',NULL,0,56),
(@campus_id,'major_cs_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,57),
-- 信息科学技术学院
(@campus_id,'major_infosci_scene','作为信息科学技术学院的同学，你常去的是信息楼、信息楼东和实训楼；三教、四教是公用教学楼。先带你认认。','学姐',@char,@bg,NULL,'scene',NULL,0,58),
(@campus_id,'major_infosci_info_map','看这片闪烁的金色区域，它就是信息楼；从图书馆往西、秋实路东侧就到。','学姐',@char,@bg,'information_building','map',NULL,0,59),
(@campus_id,'major_infosci_infoeast_map','看这片闪烁的金色区域，它就是信息楼东；就在信息楼旁边、被 C 形结构包着的小楼，找教室要留意。','学姐',@char,@bg,'information_building_east','map',NULL,0,60),
(@campus_id,'major_infosci_shixun_map','看这片闪烁的金色区域，它就是实训楼；在环能楼东南、月亮湖东侧。','学姐',@char,@bg,'practice_training_building','map',NULL,0,61),
(@campus_id,'major_infosci_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,62),
-- 机械与能源工程学院
(@campus_id,'major_mech_scene','作为机械与能源工程学院的同学，你常去机电楼、智研楼、金工楼和能源楼；三教、四教是公用教学楼。先带你认认。','学姐',@char,@bg,NULL,'scene',NULL,0,63),
(@campus_id,'major_mech_jidian_map','看这片闪烁的金色区域，它就是机电楼；在校区西北、北区宿舍以西一带。','学姐',@char,@bg,'mechanical_electrical_building','map',NULL,0,64),
(@campus_id,'major_mech_zhiyan_map','看这片闪烁的金色区域，它就是智研楼；在图书馆正北、第一教学楼西南侧。','学姐',@char,@bg,'intelligent_research_building','map',NULL,0,65),
(@campus_id,'major_mech_jingong_map','看这片闪烁的金色区域，它就是金工楼；从北体育场往北、学生公寓 11 北侧。','学姐',@char,@bg,'goldworking_building','map',NULL,0,66),
(@campus_id,'major_mech_energy_map','看这片闪烁的金色区域，它就是能源楼；在北体育场东南、学生公寓 14 南侧。','学姐',@char,@bg,'energy_building','map',NULL,0,67),
(@campus_id,'major_mech_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,68),
-- 材料科学与工程学院
(@campus_id,'major_material_scene','作为材料科学与工程学院的同学，你常去材料楼；三教、四教是公用教学楼。先带你去认认材料楼。','学姐',@char,@bg,NULL,'scene',NULL,0,69),
(@campus_id,'major_material_map','看这片闪烁的金色区域，它就是材料楼；在图书馆往北、第二教学楼南侧。','学姐',@char,@bg,'material_building','map',NULL,0,70),
(@campus_id,'major_material_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,71),
-- 建筑工程学院
(@campus_id,'major_civileng_scene','作为建筑工程学院的同学，你常去建工楼和城建楼；三教、四教是公用教学楼。先带你认认。','学姐',@char,@bg,NULL,'scene',NULL,0,72),
(@campus_id,'major_civileng_jiangong_map','看这片闪烁的金色区域，它就是建工楼；在校区西侧、材料楼往西一带。','学姐',@char,@bg,'construction_building','map',NULL,0,73),
(@campus_id,'major_civileng_chengjian_map','看这片闪烁的金色区域，它就是城建楼；在环能楼东南、月亮湖东侧的校区东南边缘。','学姐',@char,@bg,'urban_construction_building','map',NULL,0,74),
(@campus_id,'major_civileng_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,75),
-- 建筑与城市规划学院
(@campus_id,'major_archurban_scene','作为建筑与城市规划学院的同学，你常去建工楼和城建楼；三教、四教是公用教学楼。先带你认认。','学姐',@char,@bg,NULL,'scene',NULL,0,76),
(@campus_id,'major_archurban_jiangong_map','看这片闪烁的金色区域，它就是建工楼；在校区西侧、材料楼往西一带。','学姐',@char,@bg,'construction_building','map',NULL,0,77),
(@campus_id,'major_archurban_chengjian_map','看这片闪烁的金色区域，它就是城建楼；在环能楼东南、月亮湖东侧的校区东南边缘。','学姐',@char,@bg,'urban_construction_building','map',NULL,0,78),
(@campus_id,'major_archurban_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,79),
-- 城市交通学院
(@campus_id,'major_traffic_scene','作为城市交通学院的同学，你会在城建楼和实训楼附近接触智慧城市、交通规划与实践训练；三教、四教是公用教学楼。先带你去认认这两处。','学姐',@char,@bg,NULL,'scene',NULL,0,80),
(@campus_id,'major_traffic_map','看这片闪烁的金色区域，它就是城建楼；在月亮湖东侧的东南边缘教学区。','学姐',@char,@bg,'urban_construction_building','map',NULL,0,81),
(@campus_id,'major_traffic_end','再看旁边的实训楼。这里与城建楼相邻，是交通方向进行实践训练的重要地点。','学姐',@char,@bg,'practice_training_building','map',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,82),
-- 数学统计学与力学学院
(@campus_id,'major_mathstat_scene','作为数学统计学与力学学院的同学，你常去数理楼，一教也常有你们的课；三教、四教是公用教学楼。先带你认认。','学姐',@char,@bg,NULL,'scene',NULL,0,83),
(@campus_id,'major_mathstat_shuli_map','看这片闪烁的金色区域，它就是数理楼；在图书馆往北、游泳馆西侧。','学姐',@char,@bg,'physical_science_building','map',NULL,0,84),
(@campus_id,'major_mathstat_teach1_map','看这片闪烁的金色区域，它就是第一教学楼；从北体育场往西走就到。','学姐',@char,@bg,'no1_teaching_building','map',NULL,0,85),
(@campus_id,'major_mathstat_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,86),
-- 物理与光电工程学院
(@campus_id,'major_physics_scene','作为物理与光电工程学院的同学，你常去数理楼；三教、四教是公用教学楼。先带你去认认数理楼。','学姐',@char,@bg,NULL,'scene',NULL,0,87),
(@campus_id,'major_physics_map','看这片闪烁的金色区域，它就是数理楼；在图书馆往北、游泳馆西侧。','学姐',@char,@bg,'physical_science_building','map',NULL,0,88),
(@campus_id,'major_physics_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,89),
-- 化学与生命科学学院
(@campus_id,'major_lifesci_scene','作为化学与生命科学学院的同学，你常去生命楼；三教、四教是公用教学楼。先带你去认认生命楼。','学姐',@char,@bg,NULL,'scene',NULL,0,90),
(@campus_id,'major_lifesci_map','看这片闪烁的金色区域，它就是生命楼；在数理楼往南、环能楼北侧。','学姐',@char,@bg,'life_science_building','map',NULL,0,91),
(@campus_id,'major_lifesci_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,92),
-- 环境科学与工程学院
(@campus_id,'major_environ_scene','作为环境科学与工程学院的同学，你常去环能楼，能源楼也会用到；三教、四教是公用教学楼。先带你认认。','学姐',@char,@bg,NULL,'scene',NULL,0,93),
(@campus_id,'major_environ_huanneng_map','看这片闪烁的金色区域，它就是环能楼；在生命楼往南、实训楼北侧。','学姐',@char,@bg,'environment_energy_building','map',NULL,0,94),
(@campus_id,'major_environ_energy_map','看这片闪烁的金色区域，它就是能源楼；在北体育场东南、学生公寓 14 南侧。','学姐',@char,@bg,'energy_building','map',NULL,0,95),
(@campus_id,'major_environ_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,96),
-- 经济与管理学院
(@campus_id,'major_econ_scene','作为经济与管理学院的同学（社会学、法学等也在这个学院），你常去经管楼；三教、四教是公用教学楼。先带你去认认经管楼。','学姐',@char,@bg,NULL,'scene',NULL,0,97),
(@campus_id,'major_econ_map','看这片闪烁的金色区域，它就是经管楼；在秋实路东侧、科学楼往西。','学姐',@char,@bg,'economics_management_building','map',NULL,0,98),
(@campus_id,'major_econ_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,99),
-- 外国语学院
(@campus_id,'major_foreign_scene','作为外国语学院的同学，你常去人文楼；三教、四教是公用教学楼。先带你去认认人文楼。','学姐',@char,@bg,NULL,'scene',NULL,0,100),
(@campus_id,'major_foreign_map','看这片闪烁的金色区域，它就是人文楼；在博雅路南侧、奥林匹克体育馆西南侧。','学姐',@char,@bg,'humanities_building','map',NULL,0,101),
(@campus_id,'major_foreign_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,102),
-- 艺术设计学院
(@campus_id,'major_art_scene','作为艺术设计学院的同学，你常去艺术楼；四教也常有你们的课。先带你去认认艺术楼。','学姐',@char,@bg,NULL,'scene',NULL,0,103),
(@campus_id,'major_art_map','看这片闪烁的金色区域，它就是艺术楼；在第四教学楼往南、艺术广场中心。','学姐',@char,@bg,'art_building','map',NULL,0,104),
(@campus_id,'major_art_end','你学院的楼就先认到这。接下来？','学姐',@char,@bg,NULL,'choice',
 '[{"text":"再去运动场转转","targetNodeId":"sport_north_scene"},{"text":"结束本次浏览","targetNodeId":"campus_end"}]',0,105);

-- ---------- 7. 结束节点（唯一 is_end=1，触发发勋章）----------
INSERT INTO story_nodes
 (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, location_id, node_type, choices_json, is_end, sort_order)
VALUES
(@campus_id,'campus_end','今天的校园浏览先到这里。地图上的每一栋楼，都可能成为你第一次上课、运动或和朋友见面的起点；带着它再走一遍，你很快会拥有自己的校园路线。\n\n点击完成，领取勋章！','学姐',@char,'/images/story_bg_end.jpg',NULL,'scene',NULL,1,106);

-- ---------- 8. 校门段落排序 ----------
-- 校门介绍新增 3 页双地点地图，因此后移原第 3 页起的节点；分支仍按 node_key 跳转，不受影响。
UPDATE story_nodes SET sort_order=sort_order+3
  WHERE story_id=@campus_id AND sort_order>=3
    AND node_key NOT IN ('life_gate_west_map', 'life_gate_northeast_map', 'life_gate_southeast_map');

-- ---------- 9. 分区完成发章标记 ----------
-- 生活区走到分支选择页后才发"食堂时间通"；运动区走到结束选择页后才发"运动时间通"。
-- 前端到达带 grants_badge 的完成节点时调 POST /api/badges/obtain 领取（幂等）。
UPDATE story_nodes SET grants_badge='badge_canteen_time'
  WHERE story_id=@campus_id AND node_key='choose_interest';
UPDATE story_nodes SET grants_badge='badge_sports_time'
  WHERE story_id=@campus_id AND node_key='sport_end_choice';

-- ---------- 10. 两枚时间徽章定义（数据源：工大百科；方案B：点击看 detail 长文）----------
-- 发放机制：到达分区完成节点即发（见上 grants_badge + POST /api/badges/obtain），非通关补发。
INSERT INTO badges (code, name, icon_url, description, condition_text, detail, sort_order) VALUES
('badge_canteen_time','🍚 食堂时间通','/images/badge_campus.png','逛完校园食堂，掌握各食堂开放时间','完成「浏览校园」并逛过食堂区',
 '【食堂开放时间 · 来源：工大百科】\n北区餐厅：早7:00-9:00 / 午11:00-13:00 / 晚16:30-18:30\n北区餐车：周一至周五(除节假日)午11:00-12:30\n清真餐厅：7:00-20:30\n奥运餐厅：早7:00-9:00 / 午11:00-13:00 / 晚16:30-18:30\n南区餐车：周一至周五(除节假日)午11:00-12:30\n美食园餐厅：6:30-20:30；风味餐厅：9:00-22:00\n天天餐厅（学生服务楼二层）：午餐11:00-14:00 / 晚餐16:30-21:30\n天天咖啡厅：工作日7:00-21:00 / 周六日9:00-21:00（天天餐厅与天天咖啡厅是两个不同的地方）\n教工餐厅：早7:00-8:30 / 午11:00-13:00\n中蓝公寓餐厅：基本伙 早7:00-9:00/午11:00-13:00/晚16:30-18:30；风味档口7:00-21:00\n（校内食堂支持美团外卖送到宿舍楼下；具体以现场为准）',
 10),
('badge_sports_time','🏃 运动时间通','/images/badge_campus.png','逛完运动场馆，掌握各场馆开放时间与预约','完成「浏览校园」并逛过运动区',
 '【运动场馆开放时间 · 来源：工大百科】\n预约：微信小程序「运动场地预约」，一卡通注册，每日7:00放号；累计3次爽约进黑名单(可到羽毛球馆前台申请解除)。\n北田径场：全天开放，免费\n南田径场：周一至周五6:00-18:00(实际全天开放)，免费\n篮球场/排球场：6:00-20:00（南操场南侧）\n网球场：6:00-20:00（南操场北侧）\n健身房：周一至周五10:00-22:00 / 周六日9:00-22:00（体育馆北4口，正对人文楼东门）\n乒乓球馆：周一二四17:00-20:00 / 周三六日12:00-20:00 / 周五16:00-20:00（南操场西侧地下一层）\n游泳馆：周一二四17:30-20:00 / 周三六日12:00-17:00,17:30-20:00 / 周五15:30-17:00,17:30-20:00（每场1.5h，首次需体检表）\n羽毛球馆：周一至周五10:00-22:00 / 周六日及节假日8:00-22:00（奥运场馆一层北一门）\n地下训练馆：优先保障课程与校队训练\n（各场馆价格分校内师生/亲友/校外，以百科「运动场地」页为准）',
 11)
ON DUPLICATE KEY UPDATE
 name=VALUES(name), icon_url=VALUES(icon_url), description=VALUES(description),
 condition_text=VALUES(condition_text), detail=VALUES(detail), sort_order=VALUES(sort_order);
