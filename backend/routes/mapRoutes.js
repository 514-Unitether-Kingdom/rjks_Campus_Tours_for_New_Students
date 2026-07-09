const router = require('express').Router();
const mapController = require('../controllers/mapController');
const auth = require('../middlewares/auth');

router.get('/active', auth, mapController.getActiveMap);

module.exports = router;
