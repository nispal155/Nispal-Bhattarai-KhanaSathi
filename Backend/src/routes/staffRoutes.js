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
    toggleStatus
} = require('../controller/staffController');

router.post('/add', addStaff);
router.get('/all', getAllStaff);
router.get('/profile/:id', getProfile);
router.put('/update/:id', updateStaff);
router.put('/update-profile-picture', updateProfilePicture);
router.put('/toggle-status', toggleStatus);
router.delete('/delete/:id', deleteStaff);
router.put('/complete-profile', completeProfile);

module.exports = router;
