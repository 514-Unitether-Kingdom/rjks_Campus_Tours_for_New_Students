const Story = require('../models/Story');

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
// TODO: 任晟达后续在这里补充 完成剧情、发放勋章、存档等接口