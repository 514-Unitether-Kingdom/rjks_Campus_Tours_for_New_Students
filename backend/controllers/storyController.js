const Story = require('../models/Story');
const Badge = require('../models/Badge');
const UserStoryProgress = require('../models/UserStoryProgress');
const db = require('../config/db'); // 用于事务

// 获取所有剧情列表
exports.getStoryList = async (req, res, next) => {
  try {
    const list = await Story.findAll();
    res.success(list);
  } catch (err) {
    next(err); // 交给全局错误处理器
  }
};

// 获取单个剧情详情（含节点）
exports.getStoryDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);
    if (!story) return res.fail(4001, '剧情不存在');
    res.success(story);
  } catch (err) {
    next(err);
  }
};

exports.completeStory = async (req, res, next) => {
  const userId = req.user.id;
  const storyId = parseInt(req.params.id);

  try {
    // 1. 查询剧情是否存在
    const story = await Story.findById(storyId);
    if (!story) {
      return res.fail(4001, '剧情不存在');
    }

    // 2. 事务：标记完成 + 发放勋章（如果有）
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 标记完成（幂等）
      const [progressResult] = await connection.query(
        'INSERT IGNORE INTO user_story_progress (user_id, story_id) VALUES (?, ?)',
        [userId, storyId]
      );
      const isFirstComplete = progressResult.affectedRows > 0;

      let badge = null;
      let alreadyObtained = false;

      // 如果剧情关联勋章
      if (story.badge_id) {
        // 检查用户是否已获得该勋章
        const [existRows] = await connection.query(
          'SELECT 1 FROM user_badges WHERE user_id = ? AND badge_id = ?',
          [userId, story.badge_id]
        );
        if (existRows.length === 0) {
          // 授予勋章
          await connection.query(
            'INSERT INTO user_badges (user_id, badge_id, story_id) VALUES (?, ?, ?)',
            [userId, story.badge_id, storyId]
          );
          // 获取勋章详情
          const [badgeRows] = await connection.query('SELECT * FROM badges WHERE id = ?', [story.badge_id]);
          badge = badgeRows[0];
          alreadyObtained = false;
        } else {
          alreadyObtained = true;
          // 即使已获得，也返回勋章信息
          const [badgeRows] = await connection.query('SELECT * FROM badges WHERE id = ?', [story.badge_id]);
          badge = badgeRows[0];
        }
      }

      await connection.commit();
      connection.release();

      res.success({
        storyId,
        completed: true,
        badge,
        alreadyObtained,
        isFirstComplete
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};