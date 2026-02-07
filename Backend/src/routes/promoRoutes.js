const express = require('express');
const router = express.Router();
const {
  createPromoCode,
  getAllPromoCodes,
  getActivePromoCodes,
  validatePromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeStatus,
  broadcastPromoNotification,
  getPromoAuditLog
} = require('../controller/promoController');
const { protect, admin, restaurantManager } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Customer routes (any authenticated user)
router.get('/active', getActivePromoCodes);
router.post('/validate', validatePromoCode);

// Admin & Restaurant Manager routes (RBAC enforced in controller)
router.post('/', createPromoCode);
router.get('/', getAllPromoCodes);
router.put('/:id', updatePromoCode);
router.put('/:id/toggle', togglePromoCodeStatus);
router.delete('/:id', deletePromoCode);

// Admin-only routes
router.post('/broadcast/:id', admin, broadcastPromoNotification);
router.get('/:id/audit', admin, getPromoAuditLog);

module.exports = router;
