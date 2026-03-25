const SupportTicket = require('../models/SupportTicket');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const { getIO } = require('../services/socket');

const sanitizeTicket = (ticket) => ({
  _id: ticket._id,
  subject: ticket.subject,
  message: ticket.message,
  category: ticket.category,
  status: ticket.status,
  priority: ticket.priority,
  submittedByRole: ticket.submittedByRole,
  submittedBy: ticket.submittedBy,
  assignedAdmin: ticket.assignedAdmin,
  relatedOrder: ticket.relatedOrder,
  resolution: ticket.resolution,
  resolvedAt: ticket.resolvedAt,
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt
});

const isUserAllowedToReferenceOrder = async (user, orderId) => {
  if (!orderId) {
    return true;
  }

  const order = await Order.findById(orderId).select('customer restaurant deliveryRider');
  if (!order) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  if (order.customer?.toString() === user._id.toString()) {
    return true;
  }

  if (order.deliveryRider?.toString() === user._id.toString()) {
    return true;
  }

  if (user.role === 'restaurant') {
    return Boolean(await Restaurant.exists({
      _id: order.restaurant,
      createdBy: user._id
    }));
  }

  return false;
};

exports.createSupportTicket = async (req, res) => {
  try {
    const { subject, message, category, priority, relatedOrder } = req.body || {};

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    if (!(await isUserAllowedToReferenceOrder(req.user, relatedOrder))) {
      return res.status(400).json({
        success: false,
        message: 'The selected order could not be linked to this ticket'
      });
    }

    const ticket = await SupportTicket.create({
      subject: subject.trim(),
      message: message.trim(),
      category,
      priority,
      relatedOrder: relatedOrder || null,
      submittedBy: req.user._id,
      submittedByRole: req.user.role
    });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('submittedBy', 'username email role')
      .populate('assignedAdmin', 'username email')
      .populate('relatedOrder', 'orderNumber status');

    try {
      const io = getIO();
      io.to('admin').emit('supportTicketCreated', {
        ticketId: populatedTicket._id.toString(),
        subject: populatedTicket.subject,
        priority: populatedTicket.priority,
        category: populatedTicket.category,
        submittedByRole: populatedTicket.submittedByRole
      });
    } catch (socketError) {
      // Non-blocking for ticket creation.
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: sanitizeTicket(populatedTicket)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error.message
    });
  }
};

exports.getMySupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ submittedBy: req.user._id })
      .populate('assignedAdmin', 'username email')
      .populate('relatedOrder', 'orderNumber status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets.map(sanitizeTicket)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load support tickets',
      error: error.message
    });
  }
};

exports.getAdminSupportTickets = async (req, res) => {
  try {
    const { status, category, priority, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await SupportTicket.find(query)
      .populate('submittedBy', 'username email role')
      .populate('assignedAdmin', 'username email')
      .populate('relatedOrder', 'orderNumber status')
      .sort({ createdAt: -1 })
      .limit(100);

    const counts = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets.map(sanitizeTicket),
      summary: counts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load admin support tickets',
      error: error.message
    });
  }
};

exports.updateSupportTicket = async (req, res) => {
  try {
    const { status, priority, resolution, assignedAdmin } = req.body || {};
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    if (status) {
      ticket.status = status;
    }

    if (priority) {
      ticket.priority = priority;
    }

    if (typeof resolution === 'string') {
      ticket.resolution = resolution.trim();
    }

    if (assignedAdmin !== undefined) {
      ticket.assignedAdmin = assignedAdmin || req.user._id;
    } else if (!ticket.assignedAdmin) {
      ticket.assignedAdmin = req.user._id;
    }

    if (['resolved', 'closed'].includes(ticket.status)) {
      ticket.resolvedAt = new Date();
    } else {
      ticket.resolvedAt = null;
    }

    await ticket.save();

    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('submittedBy', 'username email role')
      .populate('assignedAdmin', 'username email')
      .populate('relatedOrder', 'orderNumber status');

    if (updatedTicket?.submittedBy?._id) {
      const title = ticket.status === 'resolved' ? 'Support Ticket Resolved' : 'Support Ticket Updated';
      const message = ticket.status === 'resolved'
        ? `Your support ticket "${ticket.subject}" has been resolved.`
        : `Your support ticket "${ticket.subject}" is now ${ticket.status.replace('_', ' ')}.`;

      await Notification.create({
        user: updatedTicket.submittedBy._id,
        type: 'system',
        title,
        message,
        data: { link: '/support' }
      });

      try {
        const io = getIO();
        io.to(updatedTicket.submittedBy._id.toString()).emit('notification', {
          type: 'support_ticket',
          title,
          message,
          ticketId: ticket._id.toString()
        });
      } catch (socketError) {
        // Non-blocking notification.
      }
    }

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: sanitizeTicket(updatedTicket)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update support ticket',
      error: error.message
    });
  }
};
