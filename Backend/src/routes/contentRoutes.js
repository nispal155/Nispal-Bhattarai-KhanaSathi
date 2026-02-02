const express = require('express');
const router = express.Router();
const { getContent, updateContent } = require('../controller/contentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/:slug', getContent);
router.post('/:slug', protect, admin, updateContent);

module.exports = router;
