const ProcessMarker = require('../models/ProcessMarker');
const UserStoryProgress = require('../models/UserStoryProgress');

exports.getMarkers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const markers = await ProcessMarker.findAll();

    // 获取用户已完成的短故事ID
    const completedStoryIds = await UserStoryProgress.getCompletedStoryIds(userId);

    // 为每个标记添加 completed 状态
    const result = markers.map(marker => ({
      ...marker,
      completed: completedStoryIds.includes(marker.short_story_id)
    }));

    res.success(result);
  } catch (err) {
    next(err);
  }
};