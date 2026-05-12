const router = require('express').Router();
const { getStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
router.get('/', protect, getStats);
module.exports = router;
