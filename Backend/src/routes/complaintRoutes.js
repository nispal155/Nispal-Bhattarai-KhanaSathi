const express = require('express');
const router = express.Router();
const {
    createComplaint,
    getAllComplaints,
    getMyComplaints,
    getComplaintById,
    updateComplaintStatus,
    getComplaintStats
} = require('../controller/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// User routes
router.post('/', createComplaint);
router.get('/my', getMyComplaints);

// Admin routes
router.get('/stats', authorize('admin'), getComplaintStats);
router.get('/', authorize('admin'), getAllComplaints);
router.get('/:id', getComplaintById);
router.put('/:id/status', authorize('admin'), updateComplaintStatus);

module.exports = router;
