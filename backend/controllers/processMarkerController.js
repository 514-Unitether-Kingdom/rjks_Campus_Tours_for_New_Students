const ProcessMarker = require('../models/ProcessMarker');
const StoryProgress = require('../models/StoryProgress');
const dto = require('../utils/dto');

// GET /api/process-markers
// completed 按当前用户计算：同一批标记，各人看到的勾 / 感叹号不同。
// V1.0 只返回医保报销一个标记，card / print 在种子数据里 status='hidden'
// （待澄清事项 Q-09 的结论：本期隐藏这两个入口）。
exports.getMarkers = async (req, res, next) => {
  try {
    const markers = await ProcessMarker.listVisible();
    const completed = new Set(await StoryProgress.listCompletedStoryIds(req.user.id));
    res.success(markers.map((m) => dto.toMarker(m, completed.has(m.short_story_id))));
  } catch (err) {
    next(err);
  }
};
