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
    getRiderHistory,
    getAvailableRiders
} = require('../controller/staffController');

router.post('/add', addStaff);
router.get('/all', getAllStaff);
router.get('/available', getAvailableRiders);
router.get('/profile/:id', getProfile);
router.get('/stats/:id', getRiderStats);
router.get('/earnings/:id', getRiderEarnings);
router.get('/history/:id', getRiderHistory);
router.put('/update/:id', updateStaff);
router.put('/update-profile-picture', updateProfilePicture);
router.put('/toggle-status', toggleStatus);
router.delete('/delete/:id', deleteStaff);
router.put('/complete-profile', completeProfile);

module.exports = router;

