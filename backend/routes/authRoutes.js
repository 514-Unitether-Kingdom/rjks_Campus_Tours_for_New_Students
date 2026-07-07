const router = require('express').Router();
const { wechatLogin } = require('../controllers/authController');
router.post('/wechat-login', wechatLogin);
module.exports = router;