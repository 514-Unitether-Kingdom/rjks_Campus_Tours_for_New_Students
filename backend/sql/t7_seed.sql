-- 强制本次会话使用 utf8mb4。
-- Windows 中文环境下 mysql.exe 的 character_set_client 默认是 gbk，
-- 直接 `mysql -u root -p db < 本文件` 会把 UTF-8 的中文按 GBK 解释后入库，
-- 存进去就是乱码。用 GBK 客户端查回来看着还是对的，只有应用（utf8mb4）读时才暴露。
SET NAMES utf8mb4;

-- =============================================
-- 探校之旅 —— T7 初始数据
-- 负责人：任晟达（后端 B）
--
-- 依赖：Script.sql -> t7_schema.sql -> 本文件
-- 本脚本可重复执行（全部 INSERT IGNORE，依赖唯一键去重）。
--
-- ⚠ 内容说明
--   剧情文案与图片路径均取自前端原型 requirements/prototype/utils/api.js，
--   属于占位内容，待 T8「数据与内容初始化」用真实剧情脚本与图片替换。
--   届时只需重跑本文件或执行若干 UPDATE，不产生任何代码改动。
--
--   已知：原型 images/ 目录下 story_bg1.jpg ~ story_bg5.jpg、medical_bg1~3.jpg、
--   card_bg1~2.jpg、print_bg1~2.jpg、badge_card.png、badge_print.png 共 14 个
--   文件实际不存在（目录里是名为 story_bg1~5.jpg 的单个文件）。此处仍按前端引用的
--   路径写入，保持与原型行为一致，素材到位后统一替换。
--
-- ⚠ 标识符说明
--   stories.code / badges.code / story_nodes.node_key 的取值已硬编码在前端代码中，
--   不得随意更改，详见《后端B测试需求分析待澄清事项解答》第五段。
-- =============================================

-- ---------------------------------------------
-- 勋章（V1.0 共 4 枚，card / print 对应的剧情本期隐藏，勋章墙仍显示为灰色未获得）
-- ---------------------------------------------
INSERT IGNORE INTO badges (code, name, icon_url, description, condition_text, sort_order) VALUES
('badge_campus',  '🏛️ 校园探索者', '/images/badge_campus.png',  '完成浏览校园剧情，熟悉校园环境', '完成「浏览校园」剧情', 1),
('badge_medical', '🏥 医疗达人',   '/images/badge_medical.png', '完成医保报销剧情，了解就医流程', '完成「医保报销」剧情', 2),
('badge_card',    '💳 补办高手',   '/images/badge_card.png',    '完成一卡通补办剧情，了解挂失流程', '完成「一卡通补办」剧情', 3),
('badge_print',   '🖨️ 打印能手',   '/images/badge_print.png',   '完成打印流程剧情，了解打印服务',   '完成「打印流程」剧情', 4);


-- ---------------------------------------------
-- 剧情
--   campus  长故事，支持存档
--   medical 短故事，不支持存档
--   card / print 后续迭代（Q-09 已定：V1.0 隐藏），status=disabled 不下发
-- ---------------------------------------------
INSERT IGNORE INTO stories (code, name, type, description, badge_id, max_saves, status) VALUES
('campus',  '浏览校园',     'long',  '跟随向导学姐了解校园各建筑与场所',
  (SELECT id FROM badges WHERE code='badge_campus'),  5, 'enabled'),
('medical', '医保报销流程', 'short', '了解校医院就诊与医保报销的完整流程',
  (SELECT id FROM badges WHERE code='badge_medical'), 0, 'enabled'),
('card',    '一卡通补办流程', 'short', '校园一卡通丢失后如何快速补办',
  (SELECT id FROM badges WHERE code='badge_card'),    0, 'disabled'),
('print',   '校园打印流程', 'short', '如何在校园内使用打印服务',
  (SELECT id FROM badges WHERE code='badge_print'),   0, 'disabled');


-- ---------------------------------------------
-- 剧情节点：浏览校园（长故事，6 个节点）
-- ---------------------------------------------
INSERT IGNORE INTO story_nodes (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='campus'), 'n1', '欢迎来到北京工业大学！我是你的向导学姐，今天带你逛逛校园。', '学姐', '/images/character_xuejie.png', '/images/story_bg1.jpg', 0, 1),
((SELECT id FROM stories WHERE code='campus'), 'n2', '这是我们的主教学楼——第一教学楼，大部分课程都在这里进行。',   '学姐', '/images/character_xuejie.png', '/images/story_bg2.jpg', 0, 2),
((SELECT id FROM stories WHERE code='campus'), 'n3', '那边是图书馆，你可以在这里自习、借书，记得带校园卡哦。',       '学姐', '/images/character_xuejie.png', '/images/story_bg3.jpg', 0, 3),
((SELECT id FROM stories WHERE code='campus'), 'n4', '这是食堂，有三层，各种美食应有尽有！',                         '学姐', '/images/character_xuejie.png', '/images/story_bg4.jpg', 0, 4),
((SELECT id FROM stories WHERE code='campus'), 'n5', '校医院在校园东南角，生病了记得及时就医。',                     '学姐', '/images/character_xuejie.png', '/images/story_bg5.jpg', 0, 5),
((SELECT id FROM stories WHERE code='campus'), 'n_end', '🎉 校园就介绍到这里啦！\n\n点击完成剧情，获得勋章！',       '学姐', '/images/character_xuejie.png', '/images/story_bg_end.jpg', 1, 6);


-- ---------------------------------------------
-- 剧情节点：医保报销（短故事，多分支）
-- ---------------------------------------------
INSERT IGNORE INTO story_nodes
 (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, location_id, node_type, choices_json, is_end, sort_order)
VALUES
((SELECT id FROM stories WHERE code='medical'),'m1','同学你好，我是校医院的王医生。医保报销看起来步骤不少，但只要先选对就医路线、再把材料带齐，就不会手忙脚乱。我们一步一步来。','校医',NULL,'/images/medical_bg1.jpg','school_hospital','scene',NULL,0,1),
((SELECT id FROM stories WHERE code='medical'),'m2','先做个小自检：这套流程适用于已注册的统招本科生、研究生，以及因病休学保留学籍、毕业一年内未就业且仍符合待遇条件的同学。拿不准时，可以在企业微信搜索“小百科”咨询。','校医',NULL,'/images/medical_bg1.jpg',NULL,'scene',NULL,0,2),
((SELECT id FROM stories WHERE code='medical'),'m3','无论走哪条路线，先记住三件事：带好校园一卡通和身份证；到校外医院挂号、缴费时主动说明“公费医疗，走自费结算”；绝对不要使用医保卡（社保卡），否则这笔费用不能再按公费医疗报销。','校医',NULL,'/images/medical_bg1.jpg',NULL,'scene',NULL,0,3),
((SELECT id FROM stories WHERE code='medical'),'m4_situation_choice','现在的情况更接近哪一种？','校医',NULL,'/images/medical_bg1.jpg',NULL,'choice',
 '[{"text":"工作日普通门诊","targetNodeId":"m5_workday_booking"},{"text":"周末、节假日或寒暑假普通门诊","targetNodeId":"m8_rest_choice"},{"text":"突发急症，需要马上就医","targetNodeId":"m11_emergency_nearby"},{"text":"已经需要住院或医生建议住院","targetNodeId":"m13_inpatient_rule"}]',0,4),
((SELECT id FROM stories WHERE code='medical'),'m5_workday_booking','工作日看普通门诊，顺序不能反：先在“北京友谊医院”小程序或 App 挂好西城院区、通州院区的门诊号；确认有号后，再带着一卡通到校医院就诊。','校医',NULL,'/images/medical_bg2.jpg','school_hospital','scene',NULL,0,5),
((SELECT id FROM stories WHERE code='medical'),'m6_workday_referral','校医院医生会根据病情判断是否需要外转。需要转诊时，医生会开具盖章有效的《公费医疗转诊单》。这张单不能补开，所以没有转诊单就不要自行去校外看普通门诊。','校医',NULL,'/images/medical_bg2.jpg','school_hospital','scene',NULL,0,6),
((SELECT id FROM stories WHERE code='medical'),'m7_workday_visit','带身份证和转诊单前往友谊医院；取号、缴费时仍选择“自费”通道。校医院就诊通常报销 95%，经转诊到友谊医院门诊通常报销 90%。发票、明细、处方和病历都要保留好。','校医',NULL,'/images/medical_bg2.jpg',NULL,'choice',
 '[{"text":"再了解其他就医情形","targetNodeId":"m4_situation_choice"},{"text":"继续准备普通门诊报销材料","targetNodeId":"m17_material_outpatient"}]',0,7),
((SELECT id FROM stories WHERE code='medical'),'m8_rest_choice','周末、法定节假日或寒暑假看普通门诊时，一般不需要先到校医院开转诊单。你现在是在北京，还是已经离京返乡？','校医',NULL,'/images/medical_bg2.jpg',NULL,'choice',
 '[{"text":"在北京，准备去友谊医院","targetNodeId":"m9_rest_friendship"},{"text":"寒暑假已离京，出现急症","targetNodeId":"m10_rest_away"}]',0,8),
((SELECT id FROM stories WHERE code='medical'),'m9_rest_friendship','周末、法定节假日或寒暑假，可直接持身份证到友谊医院就诊，挂“自费”号即可，无需转诊单；符合条件的门急诊通常按 90% 报销。','校医',NULL,'/images/medical_bg2.jpg',NULL,'choice',
 '[{"text":"再了解其他就医情形","targetNodeId":"m4_situation_choice"},{"text":"继续准备普通门诊报销材料","targetNodeId":"m17_material_outpatient"}]',0,9),
((SELECT id FROM stories WHERE code='medical'),'m10_rest_away','寒暑假离京后，只能到居住地附近的医保定点医院看急诊；发热、肠道门诊也按急诊处理。急诊通常报销 50%，普通门诊仅限 30 元封顶。记得保留所有急诊材料。','校医',NULL,'/images/medical_bg2.jpg',NULL,'choice',
 '[{"text":"再了解其他就医情形","targetNodeId":"m4_situation_choice"},{"text":"继续准备急诊报销材料","targetNodeId":"m18_material_emergency"}]',0,10),
((SELECT id FROM stories WHERE code='medical'),'m11_emergency_nearby','突发急症时，优先就近去医保定点医院的急诊科，并在窗口说明“公费医疗，自费结算”。急诊只限报销一所医院，同一次情况不要同时跑多家医院。','校医',NULL,'/images/medical_bg3.jpg',NULL,'scene',NULL,0,11),
((SELECT id FROM stories WHERE code='medical'),'m12_emergency_special','垂杨柳医院不是合同医院：工作日去急诊通常需要校医院提前转诊，符合条件时可按 70% 报销；寒暑假或节假日直接急诊则按 50% 执行。若病情危重需要住院，可以先就近救治，出入院时都要声明公费医疗身份。','校医',NULL,'/images/medical_bg3.jpg',NULL,'choice',
 '[{"text":"再了解其他就医情形","targetNodeId":"m4_situation_choice"},{"text":"继续准备急诊报销材料","targetNodeId":"m18_material_emergency"}]',0,12),
((SELECT id FROM stories WHERE code='medical'),'m13_inpatient_rule','计划住院原则上应入住友谊医院，或入住经校医院转诊的指定专科医院。周末、节假日、寒暑假因急诊住院时，可以入住非合同医院的医保定点机构；超过规定标准的床位费需自行承担。','校医',NULL,'/images/medical_bg3.jpg',NULL,'scene',NULL,0,13),
((SELECT id FROM stories WHERE code='medical'),'m14_inpatient_loan_choice','如果住院费用压力较大，是否需要了解住院借款？','校医',NULL,'/images/medical_bg3.jpg',NULL,'choice',
 '[{"text":"需要了解住院借款","targetNodeId":"m15_inpatient_loan"},{"text":"不需要，继续准备住院报销材料","targetNodeId":"m16_inpatient_next"}]',0,14),
((SELECT id FROM stories WHERE code='medical'),'m15_inpatient_loan','借款仅限住院：凭住院通知单填写借款单，并缴纳借款额 20% 的押金。3 万元以下由校医院院长审批，3 万元以上需主管校领导审批；毕业生离校前两个月原则上不办理。','校医',NULL,'/images/medical_bg3.jpg',NULL,'scene',NULL,0,15),
((SELECT id FROM stories WHERE code='medical'),'m16_inpatient_next','住院路线已经说明完毕。接下来想继续了解其他就医情形，还是准备住院报销材料？','校医',NULL,'/images/medical_bg3.jpg',NULL,'choice',
 '[{"text":"再了解其他就医情形","targetNodeId":"m4_situation_choice"},{"text":"继续准备住院报销材料","targetNodeId":"m19_material_inpatient"}]',0,16),
((SELECT id FROM stories WHERE code='medical'),'m17_material_outpatient','校外普通门诊材料：发票、收费明细清单、处方底方（开药时）、门诊病历；工作日门诊还必须附转诊单。材料可在医院自助机打印；友谊医院的电子发票、病历和检验报告通常在就诊 24 小时后可从小程序下载打印。','校医',NULL,'/images/medical_bg1.jpg',NULL,'choice',
 '[{"text":"再了解其他就医情形","targetNodeId":"m4_situation_choice"},{"text":"材料齐了，进入提交与审核步骤","targetNodeId":"m20_submit"}]',0,17),
((SELECT id FROM stories WHERE code='medical'),'m18_material_emergency','急诊材料：发票、收费明细清单、急诊处方、急诊诊断证明、急诊病历。缺少其中任何一项都可能影响审核；异地就医还需要当地医院为医保定点医院的证明。','校医',NULL,'/images/medical_bg1.jpg',NULL,'choice',
 '[{"text":"再了解其他就医情形","targetNodeId":"m4_situation_choice"},{"text":"材料齐了，进入提交与审核步骤","targetNodeId":"m20_submit"}]',0,18),
((SELECT id FROM stories WHERE code='medical'),'m19_material_inpatient','住院材料：住院发票、盖医保章的费用明细清单、出院诊断证明，以及转诊单或急诊入院证明。若是外伤、休学、异地或因公外出，还要按情况补交相应证明。','校医',NULL,'/images/medical_bg1.jpg',NULL,'choice',
 '[{"text":"再了解其他就医情形","targetNodeId":"m4_situation_choice"},{"text":"材料齐了，进入提交与审核步骤","targetNodeId":"m20_submit"}]',0,19),
((SELECT id FROM stories WHERE code='medical'),'m20_submit','材料准备好后，要在费用发生当月或下一个自然月内提交；12 月发票最晚可延至次年 3 月 31 日。校本部在学综楼 4 层公费医疗报销窗口办理；通州校区在每周三下午、耕园图书馆后侧办理。','校医',NULL,'/images/medical_bg1.jpg','student_service_center','scene',NULL,0,20),
((SELECT id FROM stories WHERE code='medical'),'m21_review','审核时还会看药量：急性病一般不超过 3 日量，慢性病不超过 7 日量，行动不便不超过 2 周量；部分慢病稳定期最多 1 个月量。一张处方最多 5 种药，超量部分需要自付。','校医',NULL,'/images/medical_bg1.jpg',NULL,'scene',NULL,0,21),
((SELECT id FROM stories WHERE code='medical'),'m22_result','最后耐心等审核：门诊报销款通常在次月 3 日前打入校园卡关联账户；住院报销款通常在次月 11 日前到账。','校医',NULL,'/images/medical_bg1.jpg',NULL,'scene',NULL,0,22),
((SELECT id FROM stories WHERE code='medical'),'m_end','这次医保报销流程就带你走完了。记住口诀：先选对路线，校外走自费；单据全留好，按时去提交。\n\n点击完成，领取勋章！','校医',NULL,'/images/medical_bg_end.jpg',NULL,'scene',NULL,1,23);


-- ---------------------------------------------
-- 剧情节点：一卡通补办 / 打印流程（后续迭代，剧情 disabled，节点先入库供后台预览与导出）
-- ---------------------------------------------
INSERT IGNORE INTO story_nodes (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='card'), 'c1', '一卡通丢失不要慌，来校园卡服务中心挂失补办。', '工作人员', NULL, '/images/card_bg1.jpg', 0, 1),
((SELECT id FROM stories WHERE code='card'), 'c2', '需要缴纳工本费，然后现场拍照制卡。',           '工作人员', NULL, '/images/card_bg2.jpg', 0, 2),
((SELECT id FROM stories WHERE code='card'), 'c_end', '🎉 补办完成，新卡立等可取！\n\n点击完成剧情，获得勋章！', '工作人员', NULL, '/images/card_bg_end.jpg', 1, 3);

INSERT IGNORE INTO story_nodes (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='print'), 'p1', '同学需要打印吗？可以使用U盘或校园网传输文件。', '店员', NULL, '/images/print_bg1.jpg', 0, 1),
((SELECT id FROM stories WHERE code='print'), 'p2', '选择好打印参数后，刷卡支付即可取走打印件。',   '店员', NULL, '/images/print_bg2.jpg', 0, 2),
((SELECT id FROM stories WHERE code='print'), 'p_end', '🎉 打印完成，祝你学习顺利！\n\n点击完成剧情，获得勋章！', '店员', NULL, '/images/print_bg_end.jpg', 1, 3);


-- ---------------------------------------------
-- 办事流程标记
--   步骤文案取自前端 process-select.js 的 processData（当前硬编码在前端）
--   坐标为百分比占位值；前端当前由 CSS 定位，接入后可改为数据驱动
--   card / print 状态 hidden，V1.0 不下发（待澄清事项 Q-09 已定）
-- ---------------------------------------------
INSERT IGNORE INTO process_markers (code, name, description, steps, position_x, position_y, short_story_id, status, sort_order) VALUES
('medical', '🏥 医保报销流程', '了解校医院就诊和医保报销的完整流程',
 JSON_ARRAY('在校医院挂号就诊', '医生开具转诊单（如需外院就诊）', '持转诊单到指定医院就诊', '收集发票、病历等材料', '返校提交报销材料到校医院窗口', '等待审核，报销款打入银行卡'),
 20.50, 45.30, (SELECT id FROM stories WHERE code='medical'), 'enabled', 1),

('card', '💳 一卡通补办流程', '校园一卡通丢失后如何快速补办',
 JSON_ARRAY('在校园卡服务中心挂失', '缴纳工本费（现金/微信）', '现场拍照制卡', '领取新卡，激活使用'),
 62.00, 30.00, (SELECT id FROM stories WHERE code='card'), 'hidden', 2),

('print', '🖨️ 校园打印流程', '如何在校园内使用打印服务',
 JSON_ARRAY('前往校园打印店或图书馆打印区', '连接校园网或使用U盘', '上传/选择打印文件', '设置打印参数（单双面、份数等）', '刷卡或扫码支付', '取走打印件'),
 45.00, 70.00, (SELECT id FROM stories WHERE code='print'), 'hidden', 3);


-- ---------------------------------------------
-- 校园地图
--   高清底图 map2.png 已移到后端 public/maps/ 经 HTTPS 托管（不占小程序主包）。
--   校园地图页(map)与流程地图(process-map)都用这张服务器图；原 /images/campus_map_full.png
--   只是占位图（图上写着"地图主体"），不再使用。
--   ⚠ 真机需把 ai.tanxiaozhilv.uk 加进小程序后台 downloadFile 合法域名。
-- ---------------------------------------------
INSERT IGNORE INTO campus_maps (name, image_url, version, is_active) VALUES
('平乐园校区平面图', 'https://ai.tanxiaozhilv.uk/maps/map2.png', 'v2', 1);
-- 幂等修正：已建库（image_url 仍是旧占位图）重跑本文件时一并纠正
UPDATE campus_maps SET image_url = 'https://ai.tanxiaozhilv.uk/maps/map2.png', version = 'v2'
 WHERE is_active = 1 AND image_url = '/images/campus_map_full.png';
