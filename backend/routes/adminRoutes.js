const router = require('express').Router();
const adminController = require('../controllers/adminController');
const aiAdminController = require('../controllers/aiAdminController');
const adminAuth = require('../middlewares/adminAuth');
const auth = require('../middlewares/auth');

router.post('/login', adminController.login);

// 管理员入口可见性：用【用户 token】鉴权（普通登录用户即可查询），
// 只返回 canAdmin 供前端决定是否显示"数据管理"入口。不涉及任何后台数据与权限。
router.get('/eligibility', auth, adminController.eligibility);

// 以下均需管理员身份。adminAuth 校验 token payload 中 type === 'admin'，
// 防止普通用户拿自己的 userToken 直接调用后台接口（垂直越权）。
router.get('/stats', adminAuth, adminController.getStats);
router.get('/users', adminAuth, adminController.getUsers);
router.get('/stories', adminAuth, adminController.getStories);
router.get('/export/users.xlsx', adminAuth, adminController.exportUsersExcel);
router.get('/export/stories.txt', adminAuth, adminController.exportStoriesTxt);

// AI 助手：知识库管理 + 问答记录（T8）
router.get('/kb', adminAuth, aiAdminController.listKb);
router.post('/kb', adminAuth, aiAdminController.createKb);
router.put('/kb/:id', adminAuth, aiAdminController.updateKb);
router.delete('/kb/:id', adminAuth, aiAdminController.removeKb);
router.get('/qa-records', adminAuth, aiAdminController.listQaRecords);

module.exports = router;
