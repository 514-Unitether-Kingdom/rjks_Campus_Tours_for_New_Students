const db = require('../config/db');
const SaveSlot = require('../models/SaveSlot');
const Story = require('../models/Story');
const C = require('../utils/constants');
const dto = require('../utils/dto');

// GET /api/save-slots?storyId=campus
// storyId 可选。前端 saves.js 调 getSaveSlots(userId) 不带参数，
// 因此不能把它设成必填。
exports.list = async (req, res, next) => {
  try {
    let storyPk = null;
    if (req.query.storyId) {
      const story = await Story.findByRef(req.query.storyId);
      if (!story) return res.fail(C.STORY_NOT_FOUND, '剧情不存在');
      storyPk = story.id;
    }
    const rows = await SaveSlot.listByUser(req.user.id, storyPk);
    res.success(rows.map(dto.toSaveSlot));
  } catch (err) {
    next(err);
  }
};

// POST /api/save-slots   body: { storyId: 'campus', nodeId: 'n3', slotIndex?: 1 }
//
// 两条业务规则都由后端强制，不依赖前端隐藏按钮——请求可以绕过前端直接发：
//   1. 短剧情禁止存档          -> 3102
//   2. 存档数达 max_saves 上限 -> 3101
//
// slotIndex 不传时后端自动分配最小空闲档位（待澄清事项 Q-03 的结论：
// V1.0 只新建、不做覆盖，前端也没有存档位选择界面）。传了则覆盖该档位，
// 为后续迭代留出扩展口。
exports.save = async (req, res, next) => {
  const userId = req.user.id;
  let conn;
  try {
    const { storyId, nodeId } = req.body;
    if (!storyId || !nodeId) {
      return res.fail(C.PARAM_MISSING, '缺少必要参数：storyId、nodeId');
    }

    const story = await Story.findByRef(storyId);
    if (!story) return res.fail(C.STORY_NOT_FOUND, '剧情不存在');
    if (story.type !== 'long') {
      return res.fail(C.SAVE_NOT_ALLOWED_FOR_SHORT_STORY, '短剧情不支持存档');
    }

    const node = await Story.findNodeByKey(story.id, nodeId);
    if (!node) return res.fail(C.STORY_NODE_NOT_FOUND, '该剧情下不存在此节点');

    let slotIndex = null;
    if (req.body.slotIndex !== undefined && req.body.slotIndex !== null) {
      slotIndex = Number(req.body.slotIndex);
      if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > story.max_saves) {
        return res.fail(C.PARAM_INVALID, `档位编号必须是 1~${story.max_saves} 的整数`);
      }
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    // 加行锁再算空闲档位，避免并发存档撞上 uk_slot 唯一键
    const used = await SaveSlot.lockUsedSlotIndexes(conn, userId, story.id);

    if (slotIndex === null) {
      slotIndex = SaveSlot.nextFreeIndex(used, story.max_saves);
      if (slotIndex === null) {
        await conn.rollback();
        return res.fail(C.SAVE_SLOT_FULL, `存档已满（最多 ${story.max_saves} 个），请先删除已有存档`);
      }
    }

    await SaveSlot.upsert(conn, userId, story.id, node.id, slotIndex);
    const [rows] = await conn.query(
      'SELECT slot_id FROM save_slots WHERE user_id = ? AND story_id = ? AND slot_index = ?',
      [userId, story.id, slotIndex]
    );
    await conn.commit();

    res.success({
      slotId: rows[0] ? rows[0].slot_id : null,
      storyId: story.code,
      storyName: story.name,
      nodeId: node.node_key,
      slotIndex
    });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch (_) { /* 交给全局处理 */ } }
    next(err);
  } finally {
    if (conn) conn.release();
  }
};

// DELETE /api/save-slots/:slotId
//
// 归属校验：存档不属于当前用户则返回 HTTP 403 + 业务码 1004。
// 这是测试文档里 T7 唯一的「高」风险项（FN-11-08 / BR-26 / RSK-03）：
// 攻击者篡改 slotId 即可删除他人存档，必须由后端按 token 中的 userId 拦截。
exports.remove = async (req, res, next) => {
  try {
    const slotId = Number(req.params.slotId);
    if (!Number.isInteger(slotId) || slotId <= 0) {
      return res.fail(C.PARAM_INVALID, '存档 ID 非法');
    }

    const slot = await SaveSlot.findById(slotId);
    if (!slot) return res.fail(C.SAVE_SLOT_NOT_FOUND, '存档不存在');

    if (slot.user_id !== req.user.id) {
      return res.fail(C.PERMISSION_DENIED, '无权操作该存档', null, 403);
    }

    await SaveSlot.deleteById(slotId);
    res.success({ deleted: true, slotId });
  } catch (err) {
    next(err);
  }
};
