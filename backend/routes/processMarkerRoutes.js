const router = require('express').Router();
const processMarkerController = require('../controllers/processMarkerController');
const auth = require('../middlewares/auth');

router.get('/', auth, processMarkerController.getMarkers);

module.exports = router;