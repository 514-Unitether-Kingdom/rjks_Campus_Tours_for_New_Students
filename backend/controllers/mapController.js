const CampusMap = require('../models/CampusMap');
const C = require('../utils/constants');
const dto = require('../utils/dto');

// GET /api/maps/active
// 只负责返回当前生效的地图并记录浏览行为。
// 缩放、拖拽、长按保存都是前端与手机能力，不归后端（F-09 / F-14）。
exports.getActiveMap = async (req, res, next) => {
  try {
    const map = await CampusMap.findActive();
    if (!map) return res.fail(C.MAP_NOT_FOUND, '地图资源更新中，请稍后查看');

    // 浏览日志属统计用途，写失败不影响地图返回
    CampusMap.recordView(req.user.id, map.id, req.headers['user-agent'])
      .catch((err) => console.warn('[map] 记录查看日志失败:', err.message));

    res.success(dto.toMap(map));
  } catch (err) {
    next(err);
  }
};
