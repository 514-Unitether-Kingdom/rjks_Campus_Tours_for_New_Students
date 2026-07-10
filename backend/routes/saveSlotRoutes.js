const router = require('express').Router();
const saveSlotController = require('../controllers/saveSlotController');
const auth = require('../middlewares/auth');

router.get('/', auth, saveSlotController.list);
router.post('/', auth, saveSlotController.save);
router.delete('/:slotId', auth, saveSlotController.remove);

module.exports = router;
