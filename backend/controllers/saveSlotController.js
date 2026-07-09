const SaveSlot = require('../models/SaveSlot');
const Story = require('../models/Story');

// 保存存档
exports.save = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storyId, nodeId, slotIndex } = req.body;

    if (!storyId || !nodeId || slotIndex === undefined) {
      return res.fail(2001, '缺少必要参数：storyId, nodeId, slotIndex');
    }

    // 检查剧情是否存在且为长故事
    const story = await Story.findById(storyId);
    if (!story) {
      return res.fail(4001, '剧情不存在');
    }
    if (story.type !== 'long') {
      return res.fail(3003, '短故事不支持存档');
    }

    // 检查档位是否有效 (1~5)
    if (slotIndex < 1 || slotIndex > 5) {
      return res.fail(2002, '档位编号必须为1-5');
    }

    // 如果该档位是新建，检查当前总数是否已达上限
    if (slotIndex > 0) {
      // 检查该档位是否已存在
      const existingSlots = await SaveSlot.findByUserAndStory(userId, storyId);
      const exists = existingSlots.some(s => s.slot_index === slotIndex);
      if (!exists) {
        // 新建档位，检查总数是否已达5
        if (existingSlots.length >= story.max_saves) {
          return res.fail(3004, `存档已满（最多${story.max_saves}个）`);
        }
      }
    }

    await SaveSlot.saveOrUpdate(userId, storyId, nodeId, slotIndex);
    res.success({ storyId, nodeId, slotIndex, message: '存档成功' });
  } catch (err) {
    next(err);
  }
};

// 获取存档列表
exports.list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storyId } = req.query;
    if (!storyId) {
      return res.fail(2001, '缺少storyId参数');
    }
    const slots = await SaveSlot.findByUserAndStory(userId, storyId);
    res.success(slots);
  } catch (err) {
    next(err);
  }
};

// 删除存档
exports.delete = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const slotId = parseInt(req.params.slotId);
    if (!slotId) {
      return res.fail(2001, '缺少存档ID');
    }

    // 验证该存档是否属于当前用户
    const slot = await SaveSlot.findById(slotId);
    if (!slot) {
      return res.fail(4002, '存档不存在');
    }
    if (slot.user_id !== userId) {
      return res.fail(3005, '无权删除此存档');
    }

    await SaveSlot.deleteById(slotId);
    res.success({ deleted: true });
  } catch (err) {
    next(err);
  }
};