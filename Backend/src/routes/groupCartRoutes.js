const express = require('express');
const router = express.Router();
const {
  createGroupCart,
  joinGroupCart,
  getGroupCart,
  getMyGroupCarts,
  addItemToGroupCart,
  updateGroupCartItem,
  removeGroupCartItem,
  toggleReady,
  lockGroupCart,
  unlockGroupCart,
  removeMember,
  leaveGroupCart,
  cancelGroupCart,
  getGroupCartSummary,
  updateSplitMode,
  initiateGroupOrder,
  payGroupShareCOD,
  payGroupShareEsewa,
  payGroupShareKhalti,
  verifyGroupEsewa,
  verifyGroupKhalti
} = require('../controller/groupCartController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);
router.use(authorize('customer'));

// Group cart CRUD
router.post('/', createGroupCart);
router.get('/my', getMyGroupCarts);
router.get('/:id', getGroupCart);
router.get('/:id/summary', getGroupCartSummary);

// Join / leave
router.post('/join', joinGroupCart);
router.post('/:id/leave', leaveGroupCart);

// Items (member-scoped)
router.post('/:id/items', addItemToGroupCart);
router.put('/:id/items', updateGroupCartItem);
router.delete('/:id/items/:menuItemId', removeGroupCartItem);

// Member actions
router.post('/:id/ready', toggleReady);

// Host actions
router.put('/:id/lock', lockGroupCart);
router.put('/:id/unlock', unlockGroupCart);
router.put('/:id/split-mode', updateSplitMode);

// Order + Payment
router.post('/:id/initiate-order', initiateGroupOrder);
router.post('/:id/place-order', initiateGroupOrder); // backward compat
router.post('/:id/pay-share/cod', payGroupShareCOD);
router.post('/:id/pay-share/esewa', payGroupShareEsewa);
router.post('/:id/pay-share/khalti', payGroupShareKhalti);
router.post('/payment/esewa/verify', verifyGroupEsewa);
router.post('/payment/khalti/verify', verifyGroupKhalti);

router.delete('/:id/members/:userId', removeMember);
router.delete('/:id', cancelGroupCart);

module.exports = router;
