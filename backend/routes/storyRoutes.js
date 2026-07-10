const router = require('express').Router();
const storyController = require('../controllers/storyController');
const auth = require('../middlewares/auth');

// 更具体的路径写在前面，避免被 /:id 抢先匹配
router.get('/', auth, storyController.listStories);
router.get('/:id/nodes', auth, storyController.getNodes);
router.post('/:id/complete', auth, storyController.completeStory);
router.get('/:id', auth, storyController.getStoryDetail);

module.exports = router;
