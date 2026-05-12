const router = require('express').Router();
const { register, login, getMe, updateSettings, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/settings', protect, updateSettings);
router.put('/password', protect, changePassword);
module.exports = router;
