-- 强制本次会话使用 utf8mb4，防 Windows mysql 客户端 GBK 乱码。
SET NAMES utf8mb4;

-- =============================================================
-- 探校之旅 —— T11 新增剧情：一卡通补办 / 选课 / 境外交流（短）+ 大学规划（长·分支）
-- 负责人：任晟达（后端 B）
-- 依赖：t7_schema.sql + t9（story_nodes 的 node_type/choices_json/grants_badge、badges.detail 已在）。
-- 可重复执行：badges/stories 用 INSERT IGNORE，story_nodes 先按 story 清空再插入（重跑即更新内容）。
-- 说明：
--   · 补办复用已有的 card 剧情/徽章/标记（原为占位、hidden），此处填真实内容并启用。
--   · 选课、境外交流为新短剧情，走"办事流程地图"标记进入（process_markers）。
--     前端 process-map.js 需在 markerLocationIds 里加两条映射（见对接文档）。
--   · 大学规划为新长剧情，带分支（选路线→看完返回→收尾），自动出现在"故事模式"，
--     渲染走 campus-story.js（分支机制与 campus/医保一致）。
--   · 背景统一用 /images/story_bg_default.jpg（真实存在、前端不改写），结束用 story_bg_end.jpg。
-- =============================================================


-- ---------------------------------------------
-- 1. 徽章（补办复用 badge_card；其余 3 枚新增。图标 PNG 需美术补，见对接文档）
-- ---------------------------------------------
INSERT IGNORE INTO badges (code, name, icon_url, description, condition_text, sort_order) VALUES
('badge_course_select', '🎓 选课达人',  '/images/badge_course_select.png', '完成选课攻略剧情，摸清三轮选课规则', '完成「选课攻略」剧情', 5),
('badge_overseas',      '✈️ 交流先锋',  '/images/badge_overseas.png',      '完成境外交流剧情，了解长期交流全流程', '完成「境外交流」剧情', 6),
('badge_plan',          '🧭 规划达人',  '/images/badge_plan.png',          '完成大学规划剧情，看清保研考研出国就业四条路', '完成「大学规划」剧情', 7);


-- ---------------------------------------------
-- 2. 剧情（card 复用并启用；其余新增）
-- ---------------------------------------------
-- 一卡通补办：复用已存在的 card 剧情，填真实内容并启用
UPDATE stories
   SET name = '一卡通补办', description = '校园卡丢了别慌，学姐带你走一遍挂失补办',
       type = 'short', max_saves = 0, status = 'enabled',
       badge_id = (SELECT id FROM badges WHERE code='badge_card')
 WHERE code = 'card';

INSERT IGNORE INTO stories (code, name, type, description, badge_id, max_saves, status) VALUES
('course_select',     '选课攻略', 'short',
  '专选通识校选怎么选、三轮选课怎么抢，学姐一次讲清',
  (SELECT id FROM badges WHERE code='badge_course_select'), 0, 'enabled'),
('overseas_exchange', '境外交流', 'short',
  '长期境外交流从申请到回国的完整流程',
  (SELECT id FROM badges WHERE code='badge_overseas'), 0, 'enabled'),
('campus_plan',       '大学规划', 'long',
  '大四出路提前看：保研、考研、出国、就业四条路怎么准备',
  (SELECT id FROM badges WHERE code='badge_plan'), 5, 'enabled');


-- ---------------------------------------------
-- 3. 剧情节点
--    每个剧情先清空自己的旧节点再插入，保证重跑即更新、内容与本文件一致。
-- ---------------------------------------------

-- ===== 3.1 一卡通补办（card，短，线性）=====
DELETE FROM story_nodes WHERE story_id = (SELECT id FROM stories WHERE code='card');
INSERT INTO story_nodes (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, node_type, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='card'), 'card1', 'oi！看什么呢……校园卡？正好跟你说说一卡通的事，刚开学丢卡的人特别多。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 1),
((SELECT id FROM stories WHERE code='card'), 'card2', '先说明白，一卡通是你在这学校最重要的东西。食堂吃饭、进图书馆、刷校门和操场门禁、期末体测，全靠它，不带卡基本寸步难行。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 2),
((SELECT id FROM stories WHERE code='card'), 'card3', '实体卡报到时学院会发。同时登录"日新工大"APP，里面有"校园码/虚拟卡"，能刷手机支付，忘带卡时能顶上。两个是同一账户、余额互通。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 3),
((SELECT id FROM stories WHERE code='card'), 'card4', '一卡通初始密码是身份证后六位（带X的试试0或1）。注意这是消费超限额时输的密码，不是登录密码，别搞混。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 4),
((SELECT id FROM stories WHERE code='card'), 'card5', '拿到卡第一件事——改密码。"日新工大"APP或校内自助机都能改，改完记牢。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 5),
((SELECT id FROM stories WHERE code='card'), 'card6', '接下来重点说丢了怎么办，这个你大概率用得上，先记住。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 6),
((SELECT id FROM stories WHERE code='card'), 'card7', '第一步别急着补。先去"校园喵"论坛或贴吧的"失物招领"看看，很多人捡到卡会发帖；没有就自己发一条，写清时间、地点、姓名、学号。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 7),
((SELECT id FROM stories WHERE code='card'), 'card8', '第二步，一两天没找到就去自助补卡机。北工大补卡机不少——知新园、三教、四教、北区餐厅西侧、学综楼四层，主要楼宇基本都有。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 8),
((SELECT id FROM stories WHERE code='card'), 'card9', '补卡流程：身份证放读卡区，输学号和密码，按提示挂失、确认身份、扣费11元（从一卡通余额扣），扣完当场出卡，余额实时转到新卡。全程三五分钟。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 9),
((SELECT id FROM stories WHERE code='card'), 'card10', '如果余额不够11元，先在"日新工大"APP用支付宝或微信充值再补，不然机器会卡住。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 10),
((SELECT id FROM stories WHERE code='card'), 'card11', '补卡遇到问题——身份证读不出、系统报错，打 67392429，或直接去知新园101一卡通服务大厅，工作日8:00到17:00有人。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 11),
((SELECT id FROM stories WHERE code='card'), 'card12', '对了，补卡后旧实体卡自动作废，捡到也没用，不用管它。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 12),
((SELECT id FROM stories WHERE code='card'), 'card13', '最后提醒：卡别弯折、别打孔、别靠强磁场，里面是芯片，坏了补卡照样收费。平时放卡套里，别跟钥匙手机塞一起，能少丢几次。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 13),
((SELECT id FROM stories WHERE code='card'), 'card_end', '就这些。吃饭去吧，食堂刷你的新卡试试灵不灵。\n\n点击完成剧情，获得勋章！', '学姐', '/images/character_xuejie.png', '/images/story_bg_end.jpg', 'scene', 1, 14);


-- ===== 3.2 选课攻略（course_select，短，线性）=====
DELETE FROM story_nodes WHERE story_id = (SELECT id FROM stories WHERE code='course_select');
INSERT INTO story_nodes (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, node_type, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='course_select'), 'cs1', '看到从三教涌出来这拨人了吗？认识环境、办手续都只是前菜，你们真正的大学节奏从这个画面开始。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 1),
((SELECT id FROM stories WHERE code='course_select'), 'cs2', '这个点多半是刚下选修课。你现在课表只有必修，觉得课不多，等选课一开，你也会像他们一样在几个教学楼之间来回跑。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 2),
((SELECT id FROM stories WHERE code='course_select'), 'cs3', '趁现在把选课说清楚。先讲底层规则：必修是教务处直接置入课表的，不用你管。你要自己选的是三类——专选、通识、校选。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 3),
((SELECT id FROM stories WHERE code='course_select'), 'cs4', '专选就是专业选修课。选课时选好年级和专业，系统只显示你下学期能选的专选。很多专业大二上还没开多少，先别急；开出好几门也不是全选，照培养计划挑。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 4),
((SELECT id FROM stories WHERE code='course_select'), 'cs5', '通识是公共选修课，大二开始能选。不影响保研排名，但影响GPA。想出国的会专挑给分高的通识刷加权。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 5),
((SELECT id FROM stories WHERE code='course_select'), 'cs6', '校选是选别的专业的课。经管、社会学类普遍比工科好拿分。25届能不能用本专业专选抵校选，说法有分歧，直接问教务最稳。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 6),
((SELECT id FROM stories WHERE code='course_select'), 'cs7', '每学期选课学分上限30分。修不够不能毕业，超过34分你会累到不行，一般按28到30走。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 7),
((SELECT id FROM stories WHERE code='course_select'), 'cs8', '选课分三轮，规则不一样，搞清楚再动手。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 8),
((SELECT id FROM stories WHERE code='course_select'), 'cs9', '第一轮预选：不限容量、选多少都行，最后系统随机抽签。所以第一轮尽量多选提高中签率；不想要的课必须这轮退掉，到正选就退不了了。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 9),
((SELECT id FROM stories WHERE code='course_select'), 'cs10', '第二轮正选：先退课后抢课。退课窗口是第一轮中签但不想要的课最后的退出机会，错过就关死。退课结束才是正选抢课，有容量、先到先得。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 10),
((SELECT id FROM stories WHERE code='course_select'), 'cs11', '正选有个关键点：很多人12点半进去没好课就放弃了，但下午两点前后系统会集中释放退课余量，那才是捡漏窗口。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 11),
((SELECT id FROM stories WHERE code='course_select'), 'cs12', '正选后人太少的课会被关：专选少于15人且不足班级一半、通识少于15人都会关。被波及就第三轮补选找课，先到先得。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 12),
((SELECT id FROM stories WHERE code='course_select'), 'cs13', '转专业进来的，补修课程先去学院教务科做课程冲抵，确认缺什么再选，别自己直接冲。跟班重修若和正常课冲突，可申请免听不免考，填表备案即可。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 13),
((SELECT id FROM stories WHERE code='course_select'), 'cs14', '操作上：校内从 my.bjut.edu.cn 走统一认证，校外用 webvpn。选课界面筛选Tag里把"推荐选课"删掉，能看到的课更多。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 14),
((SELECT id FROM stories WHERE code='course_select'), 'cs15', '每学期选完去"学生学业情况查询"看还缺什么，别等大四才发现学分不够。经管类通识可抵通识任意选修学分，其他类型能不能抵——问教务。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 15),
((SELECT id FROM stories WHERE code='course_select'), 'cs16', '还有，别找人代选，也别帮别人选，账号自己管好。选课时间不固定，每次期末考完看教务处通知，自己盯着，别指望有人提醒你。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 16),
((SELECT id FROM stories WHERE code='course_select'), 'cs_end', '差不多了。你现在还没开始上课，先对选课有个概念，等能选了再细讲也不迟。\n\n点击完成剧情，获得勋章！', '学姐', '/images/character_xuejie.png', '/images/story_bg_end.jpg', 'scene', 1, 17);


-- ===== 3.3 境外交流（overseas_exchange，短，线性）=====
DELETE FROM story_nodes WHERE story_id = (SELECT id FROM stories WHERE code='overseas_exchange');
INSERT INTO story_nodes (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, node_type, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov1', '你翻的什么……境外交流手册？行，你开始看这个了。趁现在把长期境外交流的流程讲一遍，提前知道比临时跑手续省事得多。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 1),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov2', '先说什么时间能申请。长期境外交流的通知每学期初前几周发，申请的是下一学期出去。申秋季学期可选一学期或一学年；申春季学期只能一学期。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 2),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov3', '本科阶段总共最长只能申请一年境外交流。大二到大四是主要窗口，大一太早，基本没项目开放给大一。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 3),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov4', '流程第一步：等学校发布项目通知，看这学期有哪些学校、哪些专业能申请，选一个你符合条件的报名。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 4),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov5', '学校审核通过，校内流程就走完了。但要提醒你——这是两条线：北工大同意你去、境外学校也同意你去。校内过了还得申请对方项目、拿到录取，两边都成才真能出去。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 5),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov6', '校内申请走网上办事大厅，发起长期境外交流申请。审批：辅导员→学院教务科→专业负责人→学院外事秘书→学院外事领导→国际交流合作处，走完大概一个月内。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 6),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov7', '国际处通过后会反馈给学院和你本人，这时才能继续办境外学校那边的申请。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 7),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov8', '收到境外学校录取通知书后，还有几件必须做的事。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 8),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov9', '第一，参加国际处的行前说明会，必须去，不去不派出。国际处在科学楼221。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 9),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov10', '第二，在网上办事大厅办休学申请，出国前必须完成，没办休学不派出，具体问教务处。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 10),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov11', '第三，签《学生出国（境）交流协议书》，国际处会通知你签。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 11),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov12', '出发前还有件很重要的事——学分兑换。提前和学院教务科商量好境外哪些课能兑换北工大哪些课。境外期间算休学，要么用境外课程抵学分、要么回来补修，必须出发前形成书面计划。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 12),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov13', '好消息：形势与政策可在境外完成；大四毕设也能在国外做，但要满足"项目类课程+有论文+有答辩"三个条件才能抵毕设，缺一个回来还得补。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 13),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov14', '境外期间每月底填《境外交流学生情况月度反馈表》交给学院外事秘书。回国前记得问外方要官方成绩单，寄给国际处或让对方发国际处邮箱电子版。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 14),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov15', '回国后：第一，网上办事大厅办复学；第二，提交回访表和入境记录；第三，去国际处做成绩单认证。认证也要去科学楼一趟，不是你自己拿着成绩单就能找学院换学分。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 15),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov16', '钱的事：项目分自费和免学费两种，不管哪种，北工大学费都要正常交。同时不管自费公费都能申请境外交流奖学金。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 16),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov17', '奖学金分长期短期。长期分特等、一等、二等，金额一万到三万，看GPA和排名；申请时间等国际处通知。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 17),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov18', '补充：大二能申到的项目看专业，大二下比大二上多些，但主要是大三出去的多；大二报要确认学分够、专业课前置满足。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 18),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov19', '奖学金条件：特等要GPA3.5以上或专业前15%、且去世界前100合作校；一等GPA3.0以上或前30%；二等GPA2.7以上或前40%。短期项目五千，线上短期按团费30%给、封顶三千。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', 0, 19),
((SELECT id FROM stories WHERE code='overseas_exchange'), 'ov_end', '行，大概就这些。这流程跨度很长，大二大三再具体看通知就行，现在知道几个关键节点、别临时抱佛脚就好。\n\n点击完成剧情，获得勋章！', '学姐', '/images/character_xuejie.png', '/images/story_bg_end.jpg', 'scene', 1, 20);


-- ===== 3.4 大学规划（campus_plan，长，分支：选路线→看完返回→收尾）=====
-- 结构：公共开头(1-7) → 主分支点 hub(8) → 保研/考研/出国/就业各(3实景+1收口 choice) → 收尾(25-30)。
-- 每段支线末尾放 choice 收口（回主分支点 / 直接收尾），防线性翻页串到下一段。
DELETE FROM story_nodes WHERE story_id = (SELECT id FROM stories WHERE code='campus_plan');
INSERT INTO story_nodes (story_id, node_key, dialogue_text, speaker, character_image_url, bg_image_url, node_type, choices_json, is_end, sort_order) VALUES
((SELECT id FROM stories WHERE code='campus_plan'), 'plan1', '你大一课表看着挺松吧？其实平乐园08:00上第一节课。北区宿舍到一教5分钟，南区到一教10到15分钟，算好时间起床，别迟到。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 1),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan2', '食堂早餐窗口多数07:00到09:00，09:00后不补餐；美食园06:30到20:30全天有，但品种少。记住这俩时间，开学第一周别饿着。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 2),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan3', '不过今天聊的不是上课，是上课之外的事。大学四年，你要在教务系统完成三个硬指标——第二课堂学分、志愿时长、创新学分，缺任何一个，拿不到学位证。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 3),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan4', '第二课堂分德智体美劳五个方向，每方向1到2分，看学院培养方案；参加一次活动给0.1到0.5分。信息在班级群、学院公众号、"学习通"发布。大一大二每学期参加3到5次基本就够，别堆到后期。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 4),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan5', '志愿时长不低于20小时，具体看学院。迎新、校运会、图书馆整理都算，校青协和学院志愿部会发招募。大一大二顺带做，每次2到4小时，一年凑够没问题。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 5),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan6', '创新学分：大创项目春季立项，学科竞赛（挑战杯、互联网+、数学建模）、发论文、申专利都能拿。哪些算分、要多少分，查学院培养计划或问辅导员，每个学院不一样。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 6),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan7', '以上是所有人必须完成的底线。下面说你未来的方向——大四去向大概深造、出国、就业各三分之一，所以大二结束前最好定一条主路径：保研、考研、出国、就业。四条准备节奏完全不同。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 7),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_hub1', '四条路各不相同，你想先听哪条？可以都听完再决定。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'choice', '[{"text":"A. 保研","targetNodeId":"plan_by1"},{"text":"B. 考研","targetNodeId":"plan_ky1"},{"text":"C. 出国","targetNodeId":"plan_ab1"},{"text":"D. 就业","targetNodeId":"plan_job1"},{"text":"E. 我心里有数，直接收尾","targetNodeId":"plan_end1"}]', 0, 8),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_by1', '先说保研。看大一到大三GPA，专业排名前10%到15%才有推免资格；六级必须过425；有挂科或处分一票否决。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 9),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_by2', '时间线：大一到大三上每学期稳住绩点、每门课都重要（含通识）；大二起每年1到2个竞赛或科研；大三上9到10月梳理成果、定目标院校导师；大三下3到4月备个人陈述和推荐信、关注夏令营；6到7月参加夏令营，拿优秀营员基本等于预录取；大四上9月推免资格认定、填国家系统。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 10),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_by3', '真实情况：要用三年保持高绩点，竞赛科研说是"加分"其实是"标配"，没有科研经历保外校很难。另外大三下成绩仍算保研GPA、不能放松；9月学院公布推免细则以当年文件为准；没拿到理想夏令营，9月底还有预推免。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 11),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_by_back', '保研就说到这。还想看别的路线吗？', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'choice', '[{"text":"再看看别的路线","targetNodeId":"plan_hub1"},{"text":"够了，收尾吧","targetNodeId":"plan_end1"}]', 0, 12),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_ky1', '再说考研。大三下3月开始系统复习，12月底初试。核心是提前把大三下和大四上的课表清空。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 13),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_ky2', '时间线：大一到大三上正常上课但尽量提前修学分，确保大三下不超过三门；大三上10到12月定目标院校专业、查科目和参考书；寒假开始背单词、复习数学基础；大三下3到6月基础每天4到6小时；暑假7到8月强化每天8到10小时、别安排实习旅游；大四上9到10月冲刺真题加政治，10月研招网报名，12月倒数第二个周末初试，次年3到4月复试。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 14),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_ky3', '考研是信息战：大三上就要定专业课范围，别拖到大三下。考前3到4周持续高压，其他事全暂停。报名时确认院校专业代码，报错没法改，招生简章9月发布注意看科目有无调整。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 15),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_ky_back', '考研就说到这。还想看别的路线吗？', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'choice', '[{"text":"再看看别的路线","targetNodeId":"plan_hub1"},{"text":"够了，收尾吧","targetNodeId":"plan_end1"}]', 0, 16),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_ab1', '再说出国。看四年全部课程GPA（体育、通识、政治都算），目标3.5以上；语言成绩和软背景都要提前准备。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 17),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_ab2', '时间线：大一下到大二上了解目标国家学校要求、定托福还是雅思；大二全年备考，暑假或大三上首考；大三上判断要不要二刷，GRE/GMAT需要就安排在大三下；暑假或寒假做科研实习提升背景；大三下定2到3位专业课教授当推荐人、提前打招呼；暑假写文书初稿、语言最后冲刺；大四上9到10月定校网申、提交第一批。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 18),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_ab3', '提醒：大二结束还没开始语言，大三会很紧；推荐信别等申请季前两周才找教授。美国要个人陈述和简历、多数12到1月截止，英国港新滚动录取越早越好；定校时保底、匹配、冲刺校各2到3所；跟踪推荐信提交状态，推荐人没按时交等于作废。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 19),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_ab_back', '出国就说到这。还想看别的路线吗？', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'choice', '[{"text":"再看看别的路线","targetNodeId":"plan_hub1"},{"text":"够了，收尾吧","targetNodeId":"plan_end1"}]', 0, 20),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_job1', '再说直接就业。企业看实习、项目和技能，绩点不挂科能毕业就行。但实习要求连续3个月左右，得提前规划课表。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 21),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_job2', '时间线：大一下到大二上学岗位技能（校内一般不教）——技术岗学编程框架/数据库/刷算法（LeetCode 200题以上、GitHub有项目），非技术岗学产品工具/设计/数据分析；大二暑假第一段实习，不求大厂、有经历就比空白强；大三积累技能做项目；大三暑假是关键实习期，暑期实习3到5月启动、有转正机会；大四上9到10月秋招黄金期，11到12月补录，大四下3到4月春招。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 22),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_job3', '大四上课表必须空出来，秋招要跑宣讲、笔试、面试常请假。大三就关注招聘动态、学简历和面试。技术岗大三就在牛客网刷面经，非技术岗大二做一份目标岗位相关的项目或作品，面试能拿出来讲。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 23),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_job_back', '就业就说到这。还想看别的路线吗？', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'choice', '[{"text":"再看看别的路线","targetNodeId":"plan_hub1"},{"text":"够了，收尾吧","targetNodeId":"plan_end1"}]', 0, 24),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_end1', '不用太紧张，这四条路你现在不用定死，但至少要知道每条的门槛在哪。最后给你几个大学最该想清楚的提醒。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 25),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_end2', '第一，课表不等于你的一天。上课只占每天三分之一到一半，剩下的时间——下午没课、晚上、周末——决定了你大四的出路，从第一周就规划课余时间。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 26),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_end3', '第二，学分和绩点是两回事。修满学分是及格线，绩点高才有选择权——保研、转专业、出国都看绩点。大一绩点是后面所有竞争的基础，别想着先混混。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 27),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_end4', '第三，能在大三前完成的别拖到大四。四六级、第二课堂、志愿时长、创新学分、主要专业课全部提前做，每学期开学看一眼"学生学业情况查询"，知道自己还缺什么。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 28),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_end5', '第四，时间冲突不可避免，没人能什么都做。想清楚主路径是什么，把时间优先给主路径上的事。', '学姐', '/images/character_xuejie.png', '/images/story_bg_default.jpg', 'scene', NULL, 0, 29),
((SELECT id FROM stories WHERE code='campus_plan'), 'plan_end6', '具体到"创新学分怎么录""我这个专业保研比例多少"这类细节，辅导员和学院教务最权威，比任何学长学姐都准，不确定就直接问。行了，回去慢慢想，大一第一周理清楚，后面三年轻松很多。\n\n点击完成剧情，获得勋章！', '学姐', '/images/character_xuejie.png', '/images/story_bg_end.jpg', 'scene', NULL, 1, 30);


-- ---------------------------------------------
-- 4. 办事流程地图标记（短剧情入口）
--    card 复用已有标记、启用即可；选课/境外交流新增。
--    position_x/y 为兜底值：前端 process-map.js 用 markerLocationIds→地点中心定位，
--    需在前端加两条映射（course_select→no3_teaching_building、overseas_exchange→science_building）。
-- ---------------------------------------------
UPDATE process_markers SET status = 'enabled', name = '💳 一卡通补办' WHERE code = 'card';

INSERT IGNORE INTO process_markers (code, name, description, steps, position_x, position_y, short_story_id, status, sort_order) VALUES
('course_select', '🎓 选课攻略', '专选/通识/校选怎么选、三轮选课怎么抢',
 JSON_ARRAY('分清专选、通识、校选三类', '第一轮预选尽量多选（抽签）', '第二轮先退课后抢课，下午两点捡漏余量', '人少的课会被关，第三轮补选', '选完查学业情况看还缺什么'),
 50.00, 50.00, (SELECT id FROM stories WHERE code='course_select'), 'enabled', 4),
('overseas_exchange', '✈️ 境外交流', '长期境外交流从申请到回国的完整流程',
 JSON_ARRAY('看通知选符合条件的项目报名', '校内网上办事大厅逐级审批到国际处', '拿到境外学校录取', '行前说明会+办休学+签协议+学分兑换', '境外每月反馈，回国办复学、成绩单认证'),
 42.00, 78.00, (SELECT id FROM stories WHERE code='overseas_exchange'), 'enabled', 5);
