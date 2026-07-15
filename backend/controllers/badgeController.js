const Badge = require('../models/Badge');
const Story = require('../models/Story');
const C = require('../utils/constants');
const dto = require('../utils/dto');

// 可由用户"到点即时领取"的徽章白名单：徽章 code -> 归属剧情 code。
// 仅浏览校园的两枚信息徽章（食堂时间/运动时间），逛到对应区域时前端调 obtain 领取。
// 白名单挡住越权自领（如 badge_campus 必须走完剧情才发，不能直接领）。
const SELF_OBTAINABLE = {
  badge_canteen_time: 'campus',
  badge_sports_time: 'campus'
};

// GET /api/badges/me
// 返回全部勋章及当前用户的获得状态。未获得的也必须返回：
// 前端 badges.wxml 靠 item.obtained 决定渲染彩色还是灰色。
exports.getMyBadges = async (req, res, next) => {
  try {
    const all = await Badge.listAll();
    const obtained = new Set(await Badge.listObtainedIds(req.user.id));
    res.success(all.map((b) => dto.toBadge(b, obtained.has(b.id))));
  } catch (err) {
    next(err);
  }
};

// POST /api/badges/obtain   body: { code }
// 到点即时领取白名单内的徽章（浏览校园逛到食堂/运动区时前端调用）。
// 幂等：重复领取返回 alreadyObtained=true，不重复发。
exports.obtainBadge = async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim();
    const storyCode = SELF_OBTAINABLE[code];
    if (!storyCode) return res.fail(C.BADGE_NOT_OBTAINABLE, '该徽章不支持主动领取');

    const badge = await Badge.findByCode(code);
    if (!badge) return res.fail(C.BADGE_NOT_FOUND, '徽章不存在，请联系管理员');

    // user_badges.story_id 非空：这两枚徽章归属浏览校园剧情
    const story = await Story.findByRef(storyCode);
    if (!story) return res.fail(C.STORY_NOT_FOUND, '关联剧情不存在');

    const { alreadyObtained } = await Badge.grantByCode(req.user.id, badge.id, story.id);
    res.success({ badge: dto.toBadge(badge, true), alreadyObtained });
  } catch (err) {
    next(err);
  }
};
