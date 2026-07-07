const router = require('express').Router();
const storyController = require('../controllers/storyController');
const auth = require('../middlewares/auth'); // 复用认证中间件！

// 获取列表（需登录）
router.get('/', auth, storyController.getStoryList);
// 获取详情（需登录）
router.get('/:id', auth, storyController.getStoryDetail);

// TODO: 任晟达后续在这里补充 POST /complete, POST /save 等
module.exports = router;