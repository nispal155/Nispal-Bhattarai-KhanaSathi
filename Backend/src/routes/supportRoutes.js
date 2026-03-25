const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createSupportTicket,
  getMySupportTickets,
  getAdminSupportTickets,
  updateSupportTicket
} = require('../controller/supportController');

const router = express.Router();

router.use(protect);

router.post('/', createSupportTicket);
router.get('/my-tickets', getMySupportTickets);
router.get('/admin/tickets', admin, getAdminSupportTickets);
router.put('/admin/tickets/:id', admin, updateSupportTicket);

module.exports = router;
