const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getSystemSettings,
  updateSystemSettings
} = require('../controller/settingsController');

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);

module.exports = router;
