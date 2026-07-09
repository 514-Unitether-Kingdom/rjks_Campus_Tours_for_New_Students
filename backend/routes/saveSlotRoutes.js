const router = require('express').Router();
const saveSlotController = require('../controllers/saveSlotController');
const auth = require('../middlewares/auth');

router.post('/', auth, saveSlotController.save);
router.get('/', auth, saveSlotController.list);
router.delete('/:slotId', auth, saveSlotController.delete);

module.exports = router;