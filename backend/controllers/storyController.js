const db = require('../config/db');
const Story = require('../models/Story');
const StoryProgress = require('../models/StoryProgress');
const C = require('../utils/constants');
const dto = require('../utils/dto');

// GET /api/stories?type=long|short
exports.listStories = async (req, res, next) => {
  try {
    const { type } = req.query;
    if (type && !['long', 'short'].includes(type)) {
      return res.fail(C.PARAM_INVALID, 'type 只能是 long 或 short');
    }
    const rows = await Story.listEnabled(type);
    const completed = new Set(await StoryProgress.listCompletedStoryIds(req.user.id));
    res.success(rows.map((r) => ({ ...dto.toStory(r), completed: completed.has(r.id) })));
  } catch (err) {
    next(err);
  }
};

// GET /api/stories/:id  —— 剧情详情（含节点），供调试与后台使用
exports.getStoryDetail = async (req, res, next) => {
  try {
    const story = await Story.findByRef(req.params.id);
    if (!story) return res.fail(C.STORY_NOT_FOUND, '剧情不存在');
    const nodes = await Story.listNodes(story.id);
    res.success({ ...dto.toStory(story), nodes: nodes.map(dto.toNode) });
  } catch (err) {
    next(err);
  }
};

// GET /api/stories/:id/nodes?fromNodeId=n3
// :id 接受剧情 code（campus / medical）或自增 id。
// 前端 campus-story.js 写死 getStoryNodes('campus')，必须支持 code。
exports.getNodes = async (req, res, next) => {
  try {
    const story = await Story.findByRef(req.params.id);
    if (!story || story.status !== 'enabled') {
      return res.fail(C.STORY_NOT_FOUND, '剧情不存在或暂未开放');
    }
    const nodes = await Story.listNodes(story.id, req.query.fromNodeId);
    if (!nodes.length) return res.fail(C.STORY_NODE_NOT_FOUND, '该剧情暂无节点内容');
    res.success(nodes.map(dto.toNode));
  } catch (err) {
    next(err);
  }
};

// POST /api/stories/:id/complete
//
// 「记录完成状态 + 发放勋章」放在同一个事务里，要么全成功要么全回滚。
// 幂等靠 user_badges 的联合主键 (user_id, badge_id)：
// INSERT IGNORE 第二次执行时 affectedRows = 0，据此返回 alreadyObtained = true。
// 这样快速连点（FN-08-06 / RSK-04）既不会重复发勋章，也不会撞唯一键抛 500。
exports.completeStory = async (req, res, next) => {
  const userId = req.user.id;
  let conn;
  try {
    // 必须与 getNodes 一样校验 status。否则 card / print 这类本期隐藏的剧情，
    // 虽然拿不到节点内容，却仍能被直接 POST 完成并领走勋章——请求可以绕过前端直接发。
    const story = await Story.findByRef(req.params.id);
    if (!story || story.status !== 'enabled') {
      return res.fail(C.STORY_NOT_FOUND, '剧情不存在或暂未开放');
    }

    const endNodeId = await Story.findEndNodeId(story.id);

    conn = await db.getConnection();
    await conn.beginTransaction();

    await StoryProgress.markCompleted(userId, story.id, endNodeId, conn);

    let badge = null;
    let alreadyObtained = false;

    if (story.badge_id) {
      const [ins] = await conn.query(
        'INSERT IGNORE INTO user_badges (user_id, badge_id, story_id) VALUES (?, ?, ?)',
        [userId, story.badge_id, story.id]
      );
      alreadyObtained = ins.affectedRows === 0;

      const [rows] = await conn.query('SELECT * FROM badges WHERE id = ?', [story.badge_id]);
      if (rows[0]) badge = dto.toBadge(rows[0], true);
    }

    await conn.commit();
    res.success({ storyId: story.code, completed: true, badge, alreadyObtained });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) { /* 回滚失败交给全局处理 */ } }
    next(err);
  } finally {
    if (conn) conn.release();
  }
};
