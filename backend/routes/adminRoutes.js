const router = require('express').Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');

router.post('/login', adminController.login);

// 以下均需管理员身份。adminAuth 校验 token payload 中 type === 'admin'，
// 防止普通用户拿自己的 userToken 直接调用后台接口（垂直越权）。
router.get('/stats', adminAuth, adminController.getStats);
router.get('/users', adminAuth, adminController.getUsers);
router.get('/stories', adminAuth, adminController.getStories);
router.get('/export/users.xlsx', adminAuth, adminController.exportUsersExcel);
router.get('/export/stories.txt', adminAuth, adminController.exportStoriesTxt);

module.exports = router;
