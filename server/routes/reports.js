const router = require('express').Router();
const { generate } = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');
router.post('/generate', protect, generate);
module.exports = router;
