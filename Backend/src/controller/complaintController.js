const Complaint = require('../models/Complaint');

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private
 */
exports.createComplaint = async (req, res) => {
    try {
        const { order, type, subject, description, attachments } = req.body;

        const complaint = await Complaint.create({
            user: req.user._id,
            order,
            type,
            subject,
            description,
            attachments,
            statusHistory: [{
                status: 'open',
                changedBy: req.user._id,
                note: 'Complaint submitted'
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: complaint
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to submit complaint',
            error: error.message
        });
    }
};

/**
 * @desc    Get all complaints (Admin)
 * @route   GET /api/complaints
 * @access  Private (Admin)
 */
exports.getAllComplaints = async (req, res) => {
    try {
        const { status, type, priority, page = 1, limit = 20 } = req.query;

        let query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        if (priority) query.priority = priority;

        const complaints = await Complaint.find(query)
            .populate('user', 'username email profilePicture')
            .populate('order', 'orderNumber')
            .populate('assignedTo', 'username')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await Complaint.countDocuments(query);

        res.status(200).json({
            success: true,
            count: complaints.length,
            total,
            pages: Math.ceil(total / limit),
            data: complaints
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaints',
            error: error.message
        });
    }
};

/**
 * @desc    Get user's complaints
 * @route   GET /api/complaints/my
 * @access  Private
 */
exports.getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user._id })
            .populate('order', 'orderNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaints',
            error: error.message
        });
    }
};

/**
 * @desc    Get complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private
 */
exports.getComplaintById = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('user', 'username email profilePicture phone')
            .populate('order', 'orderNumber items pricing status')
            .populate('assignedTo', 'username')
            .populate('statusHistory.changedBy', 'username');

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        // Check authorization (user can only view their own complaints, admin can view all)
        if (complaint.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this complaint'
            });
        }

        res.status(200).json({
            success: true,
            data: complaint
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaint',
            error: error.message
        });
    }
};

/**
 * @desc    Update complaint status (Admin)
 * @route   PUT /api/complaints/:id/status
 * @access  Private (Admin)
 */
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { status, note, resolution, priority, assignedTo } = req.body;

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        if (status) complaint.status = status;
        if (resolution) complaint.resolution = resolution;
        if (priority) complaint.priority = priority;
        if (assignedTo) complaint.assignedTo = assignedTo;

        complaint.statusHistory.push({
            status: status || complaint.status,
            changedBy: req.user._id,
            note: note || `Status updated to ${status}`
        });

        await complaint.save();

        res.status(200).json({
            success: true,
            message: 'Complaint updated successfully',
            data: complaint
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update complaint',
            error: error.message
        });
    }
};

/**
 * @desc    Get complaint statistics (Admin)
 * @route   GET /api/complaints/stats
 * @access  Private (Admin)
 */
exports.getComplaintStats = async (req, res) => {
    try {
        const [total, open, inProgress, resolved, closed] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'open' }),
            Complaint.countDocuments({ status: 'in_progress' }),
            Complaint.countDocuments({ status: 'resolved' }),
            Complaint.countDocuments({ status: 'closed' })
        ]);

        const byType = await Complaint.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                open,
                inProgress,
                resolved,
                closed,
                byType
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaint statistics',
            error: error.message
        });
    }
};
