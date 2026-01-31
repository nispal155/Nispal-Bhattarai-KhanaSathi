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
  getCartSummary
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

module.exports = router;
