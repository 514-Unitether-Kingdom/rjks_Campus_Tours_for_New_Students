const router = require('express').Router();
const badgeController = require('../controllers/badgeController');
const auth = require('../middlewares/auth');

router.get('/me', auth, badgeController.getMyBadges);
router.post('/obtain', auth, badgeController.obtainBadge);

module.exports = router;