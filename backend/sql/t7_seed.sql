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
-- 剧情节点：医保报销（短故事，4 个节点）
-- ---------------------------------------------
INSERT IGNORE INTO story_nodes (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='medical'), 'm1', '同学你好，我是校医室的王医生。医保报销需要先在校医院开具转诊单。', '校医', NULL, '/images/medical_bg1.jpg', 0, 1),
((SELECT id FROM stories WHERE code='medical'), 'm2', '如果校医院无法处理，医生会开具转诊单，你可以去指定医院就诊。',     '校医', NULL, '/images/medical_bg2.jpg', 0, 2),
((SELECT id FROM stories WHERE code='medical'), 'm3', '就诊后，将发票、病历、转诊单等材料交回校医院报销窗口。',           '校医', NULL, '/images/medical_bg3.jpg', 0, 3),
((SELECT id FROM stories WHERE code='medical'), 'm_end', '🎉 流程就这些啦！\n\n点击完成剧情，获得勋章！',                 '校医', NULL, '/images/medical_bg_end.jpg', 1, 4);


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
-- ---------------------------------------------
INSERT IGNORE INTO campus_maps (name, image_url, version, is_active) VALUES
('平乐园校区平面图', '/images/campus_map_full.png', 'v1', 1);
