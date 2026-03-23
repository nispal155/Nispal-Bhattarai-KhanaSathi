const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyPromoCode,
  removePromoCode,
  getCartSummary,
  createSharedCart,
  joinSharedCart,
  requestParentApproval,
  getChildCartRequests,
  getChildCartRequestById,
  approveChildCartRequest,
  rejectChildCartRequest,
  addItemToChildCartRequest,
  updateChildCartRequestItem
} = require('../controller/cartController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/', getCart);
router.get('/summary', getCartSummary);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:menuItemId', removeFromCart);
router.delete('/clear', clearCart);
router.post('/apply-promo', applyPromoCode);
router.delete('/remove-promo', removePromoCode);
router.post('/share', createSharedCart);
router.post('/join', joinSharedCart);
router.post('/request-parent-approval', requestParentApproval);
router.get('/child-requests', getChildCartRequests);
router.get('/child-requests/:cartId', getChildCartRequestById);
router.post('/child-requests/:cartId/items', addItemToChildCartRequest);
router.put('/child-requests/:cartId/items', updateChildCartRequestItem);
router.put('/child-requests/:cartId/approve', approveChildCartRequest);
router.put('/child-requests/:cartId/reject', rejectChildCartRequest);

module.exports = router;
