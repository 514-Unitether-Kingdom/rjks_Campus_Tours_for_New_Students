const router = require('express').Router();
const { login } = require('../controllers/adminController');
const adminController = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');

router.post('/login', login);
router.post('/login', adminController.login);
// 以下需要管理员认证
router.get('/stats', adminAuth, adminController.getStats);
router.get('/users', adminAuth, adminController.getUsers);
router.get('/export/users.xlsx', adminAuth, adminController.exportUsersExcel);
router.get('/export/stories.txt', adminAuth, adminController.exportStoriesTxt);

module.exports = router;