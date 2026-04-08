const express = require('express');
const router = express.Router();
const {
    addStaff,
    getAllStaff,
    updateStaff,
    deleteStaff,
    completeProfile,
    getProfile,
    updateProfilePicture,
    toggleStatus,
    getRiderStats,
    getRiderEarnings,
    getRiderClaimSummary,
    createRiderPaymentClaim,
    getRiderPaymentClaims,
    updateRiderPaymentClaimStatus,
    getRiderHistory,
    getAvailableRiders,
    updateRiderProfile
} = require('../controller/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/add', addStaff);
router.get('/all', getAllStaff);
router.get('/available', getAvailableRiders);
router.get('/claims/summary', protect, authorize('delivery_staff'), getRiderClaimSummary);
router.get('/claims', protect, authorize('delivery_staff'), getRiderPaymentClaims);
router.post('/claims', protect, authorize('delivery_staff'), createRiderPaymentClaim);
router.put('/claims/:claimId/status', protect, authorize('admin'), updateRiderPaymentClaimStatus);
router.get('/profile/:id', getProfile);
router.get('/stats/:id', getRiderStats);
router.get('/earnings/:id', getRiderEarnings);
router.get('/history/:id', getRiderHistory);
router.put('/update/:id', updateStaff);
router.put('/update-profile/:id', updateRiderProfile);
router.put('/update-profile-picture', updateProfilePicture);
router.put('/toggle-status', toggleStatus);
router.delete('/delete/:id', deleteStaff);
router.put('/complete-profile', completeProfile);

module.exports = router;
