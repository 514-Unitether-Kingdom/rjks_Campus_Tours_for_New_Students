const router = require('express').Router();
const askController = require('../controllers/askController');
const auth = require('../middlewares/auth');
const rateLimit = require('../middlewares/rateLimit');

// 更具体的路径写在 /:recordId 之前
router.get('/suggestions', auth, askController.suggestions);
router.get('/history', auth, askController.history);
router.post('/stream', auth, rateLimit, askController.askStream); // 流式（SSE）
router.post('/', auth, rateLimit, askController.ask);
router.post('/:recordId/feedback', auth, askController.feedback);

module.exports = router;
