const express = require('express');
const router = express.Router();
const {
  createPromoCode,
  getAllPromoCodes,
  getActivePromoCodes,
  validatePromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeStatus
} = require('../controller/promoController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.use(protect);

// Customer routes
router.get('/active', getActivePromoCodes);
router.post('/validate', validatePromoCode);

// Admin routes
router.post('/', createPromoCode);
router.get('/', getAllPromoCodes);
router.put('/:id', updatePromoCode);
router.put('/:id/toggle', togglePromoCodeStatus);
router.delete('/:id', deletePromoCode);

module.exports = router;
