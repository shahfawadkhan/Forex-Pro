const router = require('express').Router();
const c = require('../controllers/profitController');
const { protect, authorize } = require('../middleware/auth');
router.use(protect);
router.get('/summary', c.getSummary);
router.get('/history', c.getHistory);
router.post('/reset', authorize('admin'), c.reset);
router.post('/toggle-hide', c.toggleHide);
module.exports = router;
