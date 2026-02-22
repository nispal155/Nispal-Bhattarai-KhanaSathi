const GroupCart = require('../models/GroupCart');
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const User = require('../models/User');
const Address = require('../models/Address');
const Notification = require('../models/Notification');
const PendingPayment = require('../models/PendingPayment');
const crypto = require('crypto');
const { getIO } = require('../services/socket');

// eSewa + Khalti configs (reuse from paymentController)
const ESEWA_CONFIG = {
  merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
  secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
  paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  verifyUrl: process.env.ESEWA_VERIFY_URL || 'https://rc-epay.esewa.com.np/api/epay/transaction/status/'
};
const KHALTI_CONFIG = {
  secretKey: process.env.KHALTI_SECRET_KEY || 'test_secret_key_placeholder',
  publicKey: process.env.KHALTI_PUBLIC_KEY || 'test_public_key_placeholder',
  initiateUrl: process.env.KHALTI_INITIATE_URL || 'https://dev.khalti.com/api/v2/epayment/initiate/',
  lookupUrl: process.env.KHALTI_LOOKUP_URL || 'https://dev.khalti.com/api/v2/epayment/lookup/'
};
const generateEsewaSignature = (message) => {
  return crypto.createHmac('sha256', ESEWA_CONFIG.secretKey).update(message).digest('base64');
};


function emitGroupCartUpdate(groupCart) {
  try {
    const io = getIO();
    io.to(`group-cart:${groupCart._id}`).emit('groupCartUpdated', groupCart);
  } catch (_) { /* socket not critical */ }
}

async function populateGroupCart(id) {
  return GroupCart.findById(id)
    .populate('host', 'username profilePicture')
    .populate('members.user', 'username profilePicture')
    .populate('members.items.menuItem', 'name price image isAvailable')
    .populate('members.items.restaurant', 'name logoUrl address');
}

// Create a group cart 
exports.createGroupCart = async (req, res) => {
  try {
    const { name, maxMembers, splitMode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    // Check if user already hosts an open group cart
    const existing = await GroupCart.findOne({
      host: req.user._id,
      status: { $in: ['open', 'locked', 'payment_pending'] }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active group cart',
        data: existing
      });
    }

    const groupCart = await GroupCart.create({
      name: name.trim(),
      host: req.user._id,
      maxMembers: maxMembers || 10,
      splitMode: splitMode || 'individual',
      members: [{
        user: req.user._id,
        role: 'host',
        items: [],
        isReady: false
      }]
    });

    const populated = await populateGroupCart(groupCart._id);

    res.status(201).json({
      success: true,
      message: 'Group cart created',
      data: populated
    });
  } catch (error) {
    console.error('createGroupCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to create group cart', error: error.message });
  }
};

//  Join a group cart via invite code 
exports.joinGroupCart = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const groupCart = await GroupCart.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This group cart is no longer accepting members' });
    }

    // Already a member?
    const isMember = groupCart.members.some(m => m.user.toString() === req.user._id.toString());
    if (isMember) {
      const populated = await populateGroupCart(groupCart._id);
      return res.status(200).json({ success: true, message: 'Already in this group cart', data: populated });
    }

    if (groupCart.members.length >= groupCart.maxMembers) {
      return res.status(400).json({ success: false, message: 'Group cart is full' });
    }

    groupCart.members.push({
      user: req.user._id,
      role: 'member',
      items: [],
      isReady: false
    });

    await groupCart.save();
    const populated = await populateGroupCart(groupCart._id);

    emitGroupCartUpdate(populated);

    // Notify others
    try {
      const io = getIO();
      io.to(`group-cart:${groupCart._id}`).emit('memberJoined', {
        user: { _id: req.user._id, username: req.user.username },
        groupCart: populated
      });
    } catch (_) {}

    res.status(200).json({ success: true, message: 'Joined group cart', data: populated });
  } catch (error) {
    console.error('joinGroupCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to join group cart', error: error.message });
  }
};

// Get group cart by ID 
exports.getGroupCart = async (req, res) => {
  try {
    const populated = await populateGroupCart(req.params.id);
    if (!populated) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    // Only members can view
    const isMember = populated.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group cart' });
    }

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('getGroupCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch group cart', error: error.message });
  }
};

// Get all active group carts for current user
exports.getMyGroupCarts = async (req, res) => {
  try {
    const groupCarts = await GroupCart.find({
      'members.user': req.user._id,
      $or: [
        { status: { $in: ['open', 'locked', 'payment_pending'] } },
        { status: 'ordered', updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    })
      .populate('host', 'username profilePicture')
      .populate('members.user', 'username profilePicture')
      .populate('members.items.restaurant', 'name logoUrl')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: groupCarts });
  } catch (error) {
    console.error('getMyGroupCarts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch group carts', error: error.message });
  }
};

// Add item to own items in group cart 
exports.addItemToGroupCart = async (req, res) => {
  try {
    const { menuItemId, quantity = 1, specialInstructions } = req.body;
    const { id } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Group cart is locked or closed' });
    }

    const memberIndex = groupCart.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group cart' });
    }

    const menuItem = await Menu.findById(menuItemId).populate('restaurant', 'name');
    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    if (!menuItem.isAvailable) {
      return res.status(400).json({ success: false, message: 'Menu item is not available' });
    }

    // Check if item already exists for this member
    const existingIdx = groupCart.members[memberIndex].items.findIndex(
      i => i.menuItem.toString() === menuItemId
    );

    if (existingIdx > -1) {
      groupCart.members[memberIndex].items[existingIdx].quantity += quantity;
      if (specialInstructions !== undefined) {
        groupCart.members[memberIndex].items[existingIdx].specialInstructions = specialInstructions;
      }
    } else {
      groupCart.members[memberIndex].items.push({
        menuItem: menuItemId,
        restaurant: menuItem.restaurant._id || menuItem.restaurant,
        restaurantName: menuItem.restaurant.name || '',
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image,
        quantity,
        specialInstructions
      });
    }

    // Un-ready the member when they modify items
    groupCart.members[memberIndex].isReady = false;

    await groupCart.save();
    const populated = await populateGroupCart(groupCart._id);

    emitGroupCartUpdate(populated);

    res.status(200).json({ success: true, message: 'Item added', data: populated });
  } catch (error) {
    console.error('addItemToGroupCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to add item', error: error.message });
  }
};

//Update own item quantity 
exports.updateGroupCartItem = async (req, res) => {
  try {
    const { menuItemId, quantity, specialInstructions } = req.body;
    const { id } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Group cart is locked or closed' });
    }

    const memberIndex = groupCart.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
      return res.status(403).json({ success: false, message: 'Not a member' });
    }

    const itemIdx = groupCart.members[memberIndex].items.findIndex(
      i => i.menuItem.toString() === menuItemId
    );

    if (itemIdx === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in your cart' });
    }

    if (quantity <= 0) {
      groupCart.members[memberIndex].items.splice(itemIdx, 1);
    } else {
      groupCart.members[memberIndex].items[itemIdx].quantity = quantity;
      if (specialInstructions !== undefined) {
        groupCart.members[memberIndex].items[itemIdx].specialInstructions = specialInstructions;
      }
    }

    groupCart.members[memberIndex].isReady = false;

    await groupCart.save();
    const populated = await populateGroupCart(groupCart._id);
    emitGroupCartUpdate(populated);

    res.status(200).json({ success: true, message: 'Item updated', data: populated });
  } catch (error) {
    console.error('updateGroupCartItem error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item', error: error.message });
  }
};

//Remove own item 
exports.removeGroupCartItem = async (req, res) => {
  try {
    const { id, menuItemId } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Group cart is locked or closed' });
    }

    const memberIndex = groupCart.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
      return res.status(403).json({ success: false, message: 'Not a member' });
    }

    groupCart.members[memberIndex].items = groupCart.members[memberIndex].items.filter(
      i => i.menuItem.toString() !== menuItemId
    );

    groupCart.members[memberIndex].isReady = false;

    await groupCart.save();
    const populated = await populateGroupCart(groupCart._id);
    emitGroupCartUpdate(populated);

    res.status(200).json({ success: true, message: 'Item removed', data: populated });
  } catch (error) {
    console.error('removeGroupCartItem error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item', error: error.message });
  }
};

// Toggle ready status
exports.toggleReady = async (req, res) => {
  try {
    const { id } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.status !== 'open' && groupCart.status !== 'locked') {
      return res.status(400).json({ success: false, message: 'Group cart is no longer active' });
    }

    const memberIndex = groupCart.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
      return res.status(403).json({ success: false, message: 'Not a member' });
    }

    groupCart.members[memberIndex].isReady = !groupCart.members[memberIndex].isReady;

    await groupCart.save();
    const populated = await populateGroupCart(groupCart._id);
    emitGroupCartUpdate(populated);

    // If all members are ready, notify the host
    if (populated.allReady) {
      try {
        const io = getIO();
        io.to(`group-cart:${groupCart._id}`).emit('allMembersReady', { groupCartId: groupCart._id });
      } catch (_) {}
    }

    res.status(200).json({
      success: true,
      message: groupCart.members[memberIndex].isReady ? 'Marked as ready' : 'Marked as not ready',
      data: populated
    });
  } catch (error) {
    console.error('toggleReady error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle ready', error: error.message });
  }
};

// Lock group cart (host only)
exports.lockGroupCart = async (req, res) => {
  try {
    const { id } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can lock the cart' });
    }

    if (groupCart.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Group cart is not open' });
    }

    groupCart.status = 'locked';
    await groupCart.save();

    const populated = await populateGroupCart(groupCart._id);
    emitGroupCartUpdate(populated);

    try {
      const io = getIO();
      io.to(`group-cart:${groupCart._id}`).emit('groupCartLocked', { groupCartId: groupCart._id });
    } catch (_) {}

    res.status(200).json({ success: true, message: 'Group cart locked', data: populated });
  } catch (error) {
    console.error('lockGroupCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to lock group cart', error: error.message });
  }
};

//  Unlock group cart (host only
exports.unlockGroupCart = async (req, res) => {
  try {
    const { id } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can unlock the cart' });
    }

    if (groupCart.status !== 'locked') {
      return res.status(400).json({ success: false, message: 'Group cart is not locked' });
    }

    groupCart.status = 'open';
    await groupCart.save();

    const populated = await populateGroupCart(groupCart._id);
    emitGroupCartUpdate(populated);

    res.status(200).json({ success: true, message: 'Group cart unlocked', data: populated });
  } catch (error) {
    console.error('unlockGroupCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to unlock group cart', error: error.message });
  }
};

//  Remove a member (host only)
exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can remove members' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Host cannot remove themselves. Cancel the group cart instead.' });
    }

    groupCart.members = groupCart.members.filter(m => m.user.toString() !== userId);
    await groupCart.save();

    const populated = await populateGroupCart(groupCart._id);
    emitGroupCartUpdate(populated);

    // Notify removed user
    try {
      const io = getIO();
      io.to(userId).emit('removedFromGroupCart', { groupCartId: groupCart._id });
    } catch (_) {}

    res.status(200).json({ success: true, message: 'Member removed', data: populated });
  } catch (error) {
    console.error('removeMember error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove member', error: error.message });
  }
};

// Leave group cart (member, not host)
exports.leaveGroupCart = async (req, res) => {
  try {
    const { id } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.host.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Host cannot leave. Cancel the group cart instead.' });
    }

    groupCart.members = groupCart.members.filter(m => m.user.toString() !== req.user._id.toString());
    await groupCart.save();

    const populated = await populateGroupCart(groupCart._id);
    emitGroupCartUpdate(populated);

    try {
      const io = getIO();
      io.to(`group-cart:${groupCart._id}`).emit('memberLeft', {
        user: { _id: req.user._id, username: req.user.username },
        groupCart: populated
      });
    } catch (_) {}

    res.status(200).json({ success: true, message: 'Left group cart' });
  } catch (error) {
    console.error('leaveGroupCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to leave group cart', error: error.message });
  }
};

//  Cancel / delete group cart (host only) 
exports.cancelGroupCart = async (req, res) => {
  try {
    const { id } = req.params;

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can cancel the group cart' });
    }

    groupCart.status = 'cancelled';
    await groupCart.save();

    try {
      const io = getIO();
      io.to(`group-cart:${groupCart._id}`).emit('groupCartCancelled', { groupCartId: groupCart._id });
    } catch (_) {}

    res.status(200).json({ success: true, message: 'Group cart cancelled' });
  } catch (error) {
    console.error('cancelGroupCart error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel group cart', error: error.message });
  }
};

//  Get group cart summary (for checkout) 
exports.getGroupCartSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const groupCart = await populateGroupCart(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    const isMember = groupCart.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a member' });
    }

    // Build per-member breakdown
    const memberBreakdown = groupCart.members.map(member => {
      const memberSubtotal = member.items.reduce((s, i) => s + i.price * i.quantity, 0);
      return {
        user: member.user,
        role: member.role,
        isReady: member.isReady,
        items: member.items,
        subtotal: memberSubtotal,
        itemCount: member.items.reduce((c, i) => c + i.quantity, 0)
      };
    });

    const subtotal = memberBreakdown.reduce((s, m) => s + m.subtotal, 0);
    const deliveryFee = 50;
    const serviceFee = 20;
    const discount = groupCart.promoDiscount || 0;
    const total = subtotal + deliveryFee + serviceFee - discount;

    // Per-member share based on split mode
    let perMemberShare = {};
    if (groupCart.splitMode === 'equal') {
      const share = total / groupCart.members.length;
      groupCart.members.forEach(m => { perMemberShare[m.user._id.toString()] = Math.round(share); });
    } else if (groupCart.splitMode === 'host_pays') {
      groupCart.members.forEach(m => { perMemberShare[m.user._id.toString()] = 0; });
      perMemberShare[groupCart.host._id.toString()] = total;
    } else {
      // individual – each pays for their own items + proportional fees
      groupCart.members.forEach(m => {
        const mSub = m.items.reduce((s, i) => s + i.price * i.quantity, 0);
        const proportion = subtotal > 0 ? mSub / subtotal : 0;
        const feeShare = Math.round((deliveryFee + serviceFee) * proportion);
        const discountShare = Math.round(discount * proportion);
        perMemberShare[m.user._id.toString()] = mSub + feeShare - discountShare;
      });
    }

    // Collect unique restaurants from all member items
    const restaurantSet = {};
    groupCart.members.forEach(m => {
      m.items.forEach(item => {
        const rid = (item.restaurant?._id || item.restaurant)?.toString();
        if (rid) {
          restaurantSet[rid] = {
            _id: rid,
            name: item.restaurant?.name || item.restaurantName || 'Restaurant',
            logoUrl: item.restaurant?.logoUrl || ''
          };
        }
      });
    });

    res.status(200).json({
      success: true,
      data: {
        groupCartId: groupCart._id,
        name: groupCart.name,
        restaurants: Object.values(restaurantSet),
        status: groupCart.status,
        splitMode: groupCart.splitMode,
        allReady: groupCart.allReady,
        memberBreakdown,
        pricing: {
          subtotal,
          deliveryFee,
          serviceFee,
          discount,
          total
        },
        perMemberShare,
        promoCode: groupCart.promoCode
      }
    });
  } catch (error) {
    console.error('getGroupCartSummary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get summary', error: error.message });
  }
};

// Update split mode (host only) 
exports.updateSplitMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { splitMode } = req.body;

    if (!['individual', 'equal', 'host_pays'].includes(splitMode)) {
      return res.status(400).json({ success: false, message: 'Invalid split mode' });
    }

    const groupCart = await GroupCart.findById(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can change split mode' });
    }

    groupCart.splitMode = splitMode;
    await groupCart.save();

    const populated = await populateGroupCart(groupCart._id);
    emitGroupCartUpdate(populated);

    res.status(200).json({ success: true, message: 'Split mode updated', data: populated });
  } catch (error) {
    console.error('updateSplitMode error:', error);
    res.status(500).json({ success: false, message: 'Failed to update split mode', error: error.message });
  }
};

// ── Helper: resolve delivery address ─────────────────────
async function resolveDeliveryAddress(userId, provided) {
  if (provided && provided.addressLine1) return provided;
  try {
    const saved = await Address.findOne({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
    if (saved) {
      return {
        addressLine1: saved.addressLine1,
        addressLine2: saved.addressLine2 || '',
        city: saved.city,
        state: saved.state || 'Bagmati',
        zipCode: saved.zipCode || '44600',
        label: saved.label
      };
    }
  } catch (_) {}
  return { addressLine1: 'Delivery Address', city: 'Kathmandu', state: 'Bagmati', zipCode: '44600' };
}

// ── Helper: group items by restaurant & calculate shares ──
function calculateGroupCartShares(groupCart, deliveryFee, serviceFee, discount) {
  const itemsByRestaurant = {};
  groupCart.members.forEach(member => {
    member.items.forEach(item => {
      const restId = (item.restaurant?._id || item.restaurant)?.toString();
      if (!restId) return;
      if (!itemsByRestaurant[restId]) {
        itemsByRestaurant[restId] = {
          restaurantId: restId,
          restaurantName: item.restaurantName || item.restaurant?.name || 'Restaurant',
          items: [],
          memberContributions: {}
        };
      }
      const menuItemId = item.menuItem?._id?.toString() || item.menuItem?.toString();
      const existing = itemsByRestaurant[restId].items.find(i => i.menuItem === menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemsByRestaurant[restId].items.push({
          menuItem: menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions
        });
      }
      const userId = member.user._id?.toString() || member.user.toString();
      const itemTotal = item.price * item.quantity;
      itemsByRestaurant[restId].memberContributions[userId] =
        (itemsByRestaurant[restId].memberContributions[userId] || 0) + itemTotal;
    });
  });

  const restaurantIds = Object.keys(itemsByRestaurant);
  if (restaurantIds.length === 0) {
    return { itemsByRestaurant, restaurantBuckets: [], combinedShares: {}, grandSubtotal: 0, grandTotal: 0 };
  }
  let grandSubtotal = 0;
  const restaurantBuckets = [];

  const memberCount = groupCart.members.length || 1; // guard against division by zero

  for (const restId of restaurantIds) {
    const bucket = itemsByRestaurant[restId];
    const restSubtotal = bucket.items.reduce((s, i) => s + i.price * i.quantity, 0);
    grandSubtotal += restSubtotal;
    const restDeliveryFee = Math.round(deliveryFee / restaurantIds.length);
    const restServiceFee = Math.round(serviceFee / restaurantIds.length);
    const restDiscount = Math.round(discount / restaurantIds.length);
    const restTotal = restSubtotal + restDeliveryFee + restServiceFee - restDiscount;

    const perMemberShare = {};
    if (groupCart.splitMode === 'equal') {
      const share = Math.round(restTotal / memberCount);
      groupCart.members.forEach(m => {
        const uid = m.user._id?.toString() || m.user.toString();
        perMemberShare[uid] = share;
      });
    } else if (groupCart.splitMode === 'host_pays') {
      const hostId = groupCart.host._id?.toString() || groupCart.host.toString();
      groupCart.members.forEach(m => {
        const uid = m.user._id?.toString() || m.user.toString();
        perMemberShare[uid] = 0;
      });
      perMemberShare[hostId] = restTotal;
    } else {
      // individual
      groupCart.members.forEach(m => {
        const uid = m.user._id?.toString() || m.user.toString();
        const mSub = bucket.memberContributions[uid] || 0;
        const proportion = restSubtotal > 0 ? mSub / restSubtotal : 0;
        const feeShare = Math.round((restDeliveryFee + restServiceFee) * proportion);
        const discShare = Math.round(restDiscount * proportion);
        perMemberShare[uid] = mSub + feeShare - discShare;
      });
    }

    restaurantBuckets.push({
      ...bucket,
      restSubtotal,
      restDeliveryFee,
      restServiceFee,
      restDiscount,
      restTotal,
      perMemberShare
    });
  }

  // Combined per-member total shares
  const combinedShares = {};
  restaurantBuckets.forEach(b => {
    Object.entries(b.perMemberShare).forEach(([uid, amt]) => {
      combinedShares[uid] = (combinedShares[uid] || 0) + amt;
    });
  });

  const grandTotal = grandSubtotal + deliveryFee + serviceFee - discount;

  return { itemsByRestaurant, restaurantBuckets, combinedShares, grandSubtotal, grandTotal };
}

// ── Helper: create orders from a paid group cart ──────────
async function createOrdersFromGroupCart(groupCart, paymentMethod, paymentStatus) {
  // Guard: prevent double-order if cart already ordered
  const freshGC = await GroupCart.findById(groupCart._id);
  if (freshGC && freshGC.status === 'ordered') {
    throw new Error('Orders already placed for this group cart');
  }

  const deliveryFee = 50;
  const serviceFee = 20;
  const discount = groupCart.promoDiscount || 0;
  const finalAddress = groupCart.deliveryAddress || { addressLine1: 'Delivery Address', city: 'Kathmandu', state: 'Bagmati', zipCode: '44600' };

  const { restaurantBuckets, combinedShares, grandTotal } = calculateGroupCartShares(groupCart, deliveryFee, serviceFee, discount);

  if (restaurantBuckets.length === 0) throw new Error('No items in group cart');

  const orders = [];
  const hostId = groupCart.host._id?.toString() || groupCart.host.toString();

  for (const bucket of restaurantBuckets) {
    const order = await Order.create({
      customer: groupCart.host._id || groupCart.host,
      restaurant: bucket.restaurantId,
      items: bucket.items,
      status: 'pending',
      deliveryAddress: finalAddress,
      pricing: {
        subtotal: bucket.restSubtotal,
        deliveryFee: bucket.restDeliveryFee,
        serviceFee: bucket.restServiceFee,
        discount: bucket.restDiscount,
        total: bucket.restTotal
      },
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      specialInstructions: '',
      isGroupOrder: true,
      groupCartId: groupCart._id,
      splitPayment: {
        mode: groupCart.splitMode,
        shares: Object.entries(bucket.perMemberShare).map(([userId, amount]) => ({
          user: userId,
          amount,
          status: paymentStatus === 'paid' ? 'paid' : 'pending'
        }))
      },
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
      statusHistory: [{ status: 'pending', note: `Group order from ${groupCart.name} (${paymentMethod})` }]
    });

    for (const item of bucket.items) {
      await Menu.findByIdAndUpdate(item.menuItem, { $inc: { orderCount: item.quantity } });
    }

    orders.push({
      orderId: order._id,
      orderNumber: order.orderNumber,
      restaurant: bucket.restaurantName,
      total: bucket.restTotal,
      perMemberShare: bucket.perMemberShare
    });

    // Notify restaurant owner
    try {
      const restaurant = await Restaurant.findById(bucket.restaurantId);
      const ownerId = restaurant?.createdBy || restaurant?.owner;
      if (ownerId) {
        await Notification.create({
          user: ownerId,
          type: 'order_status',
          title: 'New Group Order Received',
          message: `Group order #${order.orderNumber} from ${groupCart.name}`,
          data: { orderId: order._id }
        });
        try {
          const io = getIO();
          io.to(ownerId.toString()).emit('notification', {
            type: 'order_status',
            title: 'New Group Order Received',
            message: `Group order #${order.orderNumber} from ${groupCart.name}`,
            orderId: order._id
          });
        } catch (_) {}
      }
    } catch (_) {}
  }

  // Mark group cart as ordered
  const rawGC = await GroupCart.findById(groupCart._id);
  rawGC.status = 'ordered';
  rawGC.orderId = orders[0]?.orderId;
  await rawGC.save();

  // Notify all members via socket
  try {
    const io = getIO();
    io.to(`group-cart:${groupCart._id}`).emit('groupOrderPlaced', {
      groupCartId: groupCart._id,
      orders: orders.map(o => ({ orderId: o.orderId, orderNumber: o.orderNumber })),
      orderId: orders[0]?.orderId
    });

    const populated = await populateGroupCart(groupCart._id);
    if (populated) {
      populated.members.forEach(async (member) => {
        const memberId = member.user._id?.toString() || member.user.toString();
        if (memberId !== hostId) {
          try {
            await Notification.create({
              user: member.user._id,
              type: 'order_status',
              title: 'Group Order Placed!',
              message: `Your group order "${groupCart.name}" has been placed. ${orders.length} restaurant(s).`,
              data: { orderId: orders[0]?.orderId }
            });
            io.to(memberId).emit('notification', {
              type: 'order_status',
              title: 'Group Order Placed!',
              message: `Group order "${groupCart.name}" placed.`,
              orderId: orders[0]?.orderId
            });
          } catch (_) {}
        }
      });
    }
  } catch (_) {}

  return { orders, grandTotal, combinedShares };
}

// ── 16. Initiate group order (host only) ─────────────────
exports.initiateGroupOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, deliveryAddress } = req.body;

    if (!paymentMethod || !['cod', 'esewa', 'khalti'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method required (cod, esewa, khalti)' });
    }

    const groupCart = await populateGroupCart(id);
    if (!groupCart) {
      return res.status(404).json({ success: false, message: 'Group cart not found' });
    }

    if (groupCart.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the host can place the order' });
    }

    if (groupCart.status !== 'locked') {
      return res.status(400).json({ success: false, message: 'Group cart must be locked before placing order' });
    }

    if (!groupCart.allReady) {
      return res.status(400).json({ success: false, message: 'All members must be ready before placing order' });
    }

    const finalAddress = await resolveDeliveryAddress(req.user._id, deliveryAddress);
    const deliveryFee = 50;
    const serviceFee = 20;
    const discount = groupCart.promoDiscount || 0;
    const { combinedShares, grandTotal, restaurantBuckets } = calculateGroupCartShares(groupCart, deliveryFee, serviceFee, discount);

    if (restaurantBuckets.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in group cart' });
    }

    // Save payment method and address on group cart
    const rawGC = await GroupCart.findById(id);
    rawGC.paymentMethod = paymentMethod;
    rawGC.deliveryAddress = finalAddress;

    // ─── CASE 1: host_pays + COD → place immediately ───
    if (groupCart.splitMode === 'host_pays' && paymentMethod === 'cod') {
      // Set all members payment status
      rawGC.members.forEach(m => {
        const uid = m.user.toString();
        m.paymentMethod = 'cod';
        m.paymentAmount = combinedShares[uid] || 0;
        m.paymentStatus = 'paid';
      });
      rawGC.status = 'ordered';
      await rawGC.save();

      const updatedGC = await populateGroupCart(id);
      const result = await createOrdersFromGroupCart(updatedGC, 'cod', 'pending');

      return res.status(201).json({
        success: true,
        message: 'Group order placed successfully (COD)',
        data: { ...result, splitMode: groupCart.splitMode }
      });
    }

    // ─── CASE 2: host_pays + eSewa/Khalti → host pays total ───
    if (groupCart.splitMode === 'host_pays') {
      rawGC.members.forEach(m => {
        const uid = m.user.toString();
        m.paymentMethod = paymentMethod;
        m.paymentAmount = combinedShares[uid] || 0;
        m.paymentStatus = uid === rawGC.host.toString() ? 'pending' : 'paid'; // non-host share is $0
      });
      rawGC.status = 'payment_pending';
      await rawGC.save();

      // Create PendingPayment for the host
      const transactionUuid = `GRP-ESEWA-${id}-${Date.now()}`;
      if (paymentMethod === 'esewa') {
        const pendingPayment = await PendingPayment.create({
          user: req.user._id,
          cartData: {
            restaurantGroups: restaurantBuckets.map(b => ({
              restaurant: b.restaurantId,
              items: b.items
            }))
          },
          deliveryAddress: finalAddress,
          paymentMethod: 'esewa',
          transactionId: transactionUuid,
          totalAmount: grandTotal,
          groupCartId: id
        });

        const signatureMessage = `total_amount=${grandTotal},transaction_uuid=${transactionUuid},product_code=${ESEWA_CONFIG.merchantCode}`;
        const signature = generateEsewaSignature(signatureMessage);
        const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=esewa&status=success&type=group&groupCartId=${id}`;
        const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=esewa&status=failure&type=group&groupCartId=${id}`;

        const populated = await populateGroupCart(id);
        emitGroupCartUpdate(populated);

        return res.status(200).json({
          success: true,
          message: 'Redirecting to eSewa',
          data: {
            requiresPayment: true,
            paymentGateway: 'esewa',
            paymentUrl: ESEWA_CONFIG.paymentUrl,
            formData: {
              amount: grandTotal.toString(),
              tax_amount: '0',
              total_amount: grandTotal.toString(),
              transaction_uuid: transactionUuid,
              product_code: ESEWA_CONFIG.merchantCode,
              product_service_charge: '0',
              product_delivery_charge: '0',
              success_url: successUrl,
              failure_url: failureUrl,
              signed_field_names: 'total_amount,transaction_uuid,product_code',
              signature: signature
            },
            grandTotal,
            combinedShares,
            splitMode: groupCart.splitMode
          }
        });
      }

      // Khalti
      const user = await User.findById(req.user._id);
      const pendingPayment = await PendingPayment.create({
        user: req.user._id,
        cartData: {
          restaurantGroups: restaurantBuckets.map(b => ({
            restaurant: b.restaurantId,
            items: b.items
          }))
        },
        deliveryAddress: finalAddress,
        paymentMethod: 'khalti',
        totalAmount: grandTotal,
        groupCartId: id
      });

      const amountInPaisa = Math.round(grandTotal * 100);
      const purchaseOrderId = `GRP-${pendingPayment._id}`;
      const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=khalti&pendingId=${pendingPayment._id}&type=group&groupCartId=${id}`;

      const response = await fetch(KHALTI_CONFIG.initiateUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          return_url: returnUrl,
          website_url: process.env.FRONTEND_URL || 'http://localhost:3000',
          amount: amountInPaisa,
          purchase_order_id: purchaseOrderId,
          purchase_order_name: `Group Order: ${groupCart.name}`,
          customer_info: { name: user.username, email: user.email, phone: user.phone || '9800000000' }
        })
      });

      const khaltiResponse = await response.json();
      if (response.ok && khaltiResponse.payment_url) {
        pendingPayment.transactionId = khaltiResponse.pidx;
        await pendingPayment.save();

        const populated = await populateGroupCart(id);
        emitGroupCartUpdate(populated);

        return res.status(200).json({
          success: true,
          message: 'Redirecting to Khalti',
          data: {
            requiresPayment: true,
            paymentGateway: 'khalti',
            paymentUrl: khaltiResponse.payment_url,
            pidx: khaltiResponse.pidx,
            grandTotal,
            combinedShares,
            splitMode: groupCart.splitMode
          }
        });
      } else {
        await PendingPayment.findByIdAndDelete(pendingPayment._id);
        rawGC.status = 'locked';
        await rawGC.save();
        return res.status(400).json({ success: false, message: 'Failed to initiate Khalti payment' });
      }
    }

    // ─── CASE 3: split (individual / equal) ─────────────
    // All members need to pay their share. Set status to payment_pending.
    rawGC.members.forEach(m => {
      const uid = m.user.toString();
      m.paymentAmount = combinedShares[uid] || 0;
      m.paymentStatus = (combinedShares[uid] || 0) > 0 ? 'pending' : 'paid';
      m.paymentMethod = '';
    });
    rawGC.status = 'payment_pending';
    await rawGC.save();

    const populated = await populateGroupCart(id);
    emitGroupCartUpdate(populated);

    res.status(200).json({
      success: true,
      message: 'Payment pending – each member must pay their share',
      data: {
        requiresPayment: true,
        paymentGateway: 'member_split',
        grandTotal,
        combinedShares,
        splitMode: groupCart.splitMode,
        groupCart: populated
      }
    });
  } catch (error) {
    console.error('initiateGroupOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate group order', error: error.message });
  }
};

// ── 17. Pay group share – COD ────────────────────────────
exports.payGroupShareCOD = async (req, res) => {
  try {
    const { id } = req.params;
    const groupCart = await GroupCart.findById(id);
    if (!groupCart) return res.status(404).json({ success: false, message: 'Group cart not found' });
    if (groupCart.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: 'Group cart is not awaiting payment' });
    }

    const member = groupCart.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ success: false, message: 'You are not a member' });
    if (member.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    member.paymentStatus = 'paid';
    member.paymentMethod = 'cod';
    await groupCart.save();

    // Check if all paid → auto-place order
    const allPaid = groupCart.members.every(m => m.paymentStatus === 'paid');
    if (allPaid) {
      const populated = await populateGroupCart(id);
      const result = await createOrdersFromGroupCart(populated, 'cod', 'pending');
      emitGroupCartUpdate(await populateGroupCart(id));
      return res.status(201).json({
        success: true,
        message: 'All members paid! Group order placed.',
        data: { orderPlaced: true, ...result }
      });
    }

    const populated = await populateGroupCart(id);
    emitGroupCartUpdate(populated);
    res.status(200).json({
      success: true,
      message: 'Payment confirmed (COD). Waiting for other members.',
      data: { orderPlaced: false, groupCart: populated }
    });
  } catch (error) {
    console.error('payGroupShareCOD error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment', error: error.message });
  }
};

// ── 18. Pay group share – eSewa initiation ───────────────
exports.payGroupShareEsewa = async (req, res) => {
  try {
    const { id } = req.params;
    const groupCart = await GroupCart.findById(id);
    if (!groupCart) return res.status(404).json({ success: false, message: 'Group cart not found' });
    if (groupCart.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: 'Group cart is not awaiting payment' });
    }

    const member = groupCart.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ success: false, message: 'You are not a member' });
    if (member.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    const amount = member.paymentAmount;
    if (amount <= 0) {
      member.paymentStatus = 'paid';
      member.paymentMethod = 'esewa';
      await groupCart.save();
      return res.status(200).json({ success: true, message: 'No payment needed' });
    }

    const transactionUuid = `GRP-ESEWA-${id}-${req.user._id}-${Date.now()}`;

    await PendingPayment.create({
      user: req.user._id,
      cartData: { restaurantGroups: [] },
      deliveryAddress: groupCart.deliveryAddress || {},
      paymentMethod: 'esewa',
      transactionId: transactionUuid,
      totalAmount: amount,
      groupCartId: id
    });

    member.paymentMethod = 'esewa';
    member.paymentRef = transactionUuid;
    await groupCart.save();

    const signatureMessage = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${ESEWA_CONFIG.merchantCode}`;
    const signature = generateEsewaSignature(signatureMessage);
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=esewa&status=success&type=group&groupCartId=${id}`;
    const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=esewa&status=failure&type=group&groupCartId=${id}`;

    res.status(200).json({
      success: true,
      data: {
        paymentUrl: ESEWA_CONFIG.paymentUrl,
        formData: {
          amount: amount.toString(),
          tax_amount: '0',
          total_amount: amount.toString(),
          transaction_uuid: transactionUuid,
          product_code: ESEWA_CONFIG.merchantCode,
          product_service_charge: '0',
          product_delivery_charge: '0',
          success_url: successUrl,
          failure_url: failureUrl,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature
        }
      }
    });
  } catch (error) {
    console.error('payGroupShareEsewa error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate eSewa payment', error: error.message });
  }
};

// ── 19. Pay group share – Khalti initiation ──────────────
exports.payGroupShareKhalti = async (req, res) => {
  try {
    const { id } = req.params;
    const groupCart = await GroupCart.findById(id);
    if (!groupCart) return res.status(404).json({ success: false, message: 'Group cart not found' });
    if (groupCart.status !== 'payment_pending') {
      return res.status(400).json({ success: false, message: 'Group cart is not awaiting payment' });
    }

    const member = groupCart.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ success: false, message: 'You are not a member' });
    if (member.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    const amount = member.paymentAmount;
    if (amount <= 0) {
      member.paymentStatus = 'paid';
      member.paymentMethod = 'khalti';
      await groupCart.save();
      return res.status(200).json({ success: true, message: 'No payment needed' });
    }

    const user = await User.findById(req.user._id);
    const pendingPayment = await PendingPayment.create({
      user: req.user._id,
      cartData: { restaurantGroups: [] },
      deliveryAddress: groupCart.deliveryAddress || {},
      paymentMethod: 'khalti',
      totalAmount: amount,
      groupCartId: id
    });

    const amountInPaisa = Math.round(amount * 100);
    const purchaseOrderId = `GRP-SHARE-${pendingPayment._id}`;
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=khalti&pendingId=${pendingPayment._id}&type=group&groupCartId=${id}`;

    const response = await fetch(KHALTI_CONFIG.initiateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        return_url: returnUrl,
        website_url: process.env.FRONTEND_URL || 'http://localhost:3000',
        amount: amountInPaisa,
        purchase_order_id: purchaseOrderId,
        purchase_order_name: `Group share: ${groupCart.name}`,
        customer_info: { name: user.username, email: user.email, phone: user.phone || '9800000000' }
      })
    });

    const khaltiResponse = await response.json();
    if (response.ok && khaltiResponse.payment_url) {
      pendingPayment.transactionId = khaltiResponse.pidx;
      await pendingPayment.save();

      member.paymentMethod = 'khalti';
      member.paymentRef = khaltiResponse.pidx;
      await groupCart.save();

      return res.status(200).json({
        success: true,
        data: { paymentUrl: khaltiResponse.payment_url, pidx: khaltiResponse.pidx }
      });
    } else {
      await PendingPayment.findByIdAndDelete(pendingPayment._id);
      return res.status(400).json({ success: false, message: 'Failed to initiate Khalti payment' });
    }
  } catch (error) {
    console.error('payGroupShareKhalti error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate Khalti payment', error: error.message });
  }
};

// ── 20. Verify group eSewa payment ───────────────────────
exports.verifyGroupEsewa = async (req, res) => {
  try {
    const { data, groupCartId } = req.body;
    if (!data) return res.status(400).json({ success: false, message: 'No payment data received' });

    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    const { transaction_uuid, status, total_amount, transaction_code } = decodedData;

    const pendingPayment = await PendingPayment.findOne({ transactionId: transaction_uuid });
    if (!pendingPayment) return res.status(404).json({ success: false, message: 'Pending payment not found' });
    if (pendingPayment.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Already verified' });
    }

    if (status !== 'COMPLETE') {
      pendingPayment.status = 'failed';
      await pendingPayment.save();
      return res.status(400).json({ success: false, message: 'Payment not complete' });
    }

    // Server-side verify
    try {
      const verifyResponse = await fetch(
        `${ESEWA_CONFIG.verifyUrl}?product_code=${ESEWA_CONFIG.merchantCode}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`,
        { method: 'GET', headers: { 'Accept': 'application/json' } }
      );
      const verifyData = await verifyResponse.json();
      if (verifyData.status !== 'COMPLETE') {
        pendingPayment.status = 'failed';
        await pendingPayment.save();
        return res.status(400).json({ success: false, message: 'Server verification failed' });
      }
    } catch (verifyErr) {
      console.warn('eSewa server verify unavailable, proceeding:', verifyErr.message);
    }

    pendingPayment.status = 'completed';
    await pendingPayment.save();

    // Mark the member as paid
    // Prefer pendingPayment.groupCartId (clean DB value) over req.body groupCartId
    // which may be polluted by eSewa's ?data= appended to the callback URL
    const rawGcId = pendingPayment.groupCartId || (groupCartId ? groupCartId.split('?')[0] : null);
    if (!rawGcId) return res.status(400).json({ success: false, message: 'No group cart ID found' });
    const gcId = rawGcId.toString();
    const groupCart = await GroupCart.findById(gcId);
    if (!groupCart) return res.status(404).json({ success: false, message: 'Group cart not found' });

    const member = groupCart.members.find(m => m.user.toString() === req.user._id.toString());
    if (member) {
      member.paymentStatus = 'paid';
      member.paymentRef = transaction_code;
      await groupCart.save();
    }

    // Check if all paid
    const allPaid = groupCart.members.every(m => m.paymentStatus === 'paid');
    if (allPaid) {
      const populated = await populateGroupCart(gcId);
      const result = await createOrdersFromGroupCart(populated, 'esewa', 'paid');
      emitGroupCartUpdate(await populateGroupCart(gcId));
      return res.status(201).json({
        success: true,
        message: 'Payment verified! Group order placed.',
        data: { orderPlaced: true, ...result, groupCartId: gcId }
      });
    }

    const populated = await populateGroupCart(gcId);
    emitGroupCartUpdate(populated);
    res.status(200).json({
      success: true,
      message: 'Payment verified. Waiting for other members.',
      data: { orderPlaced: false, groupCartId: gcId }
    });
  } catch (error) {
    console.error('verifyGroupEsewa error:', error);
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

// ── 21. Verify group Khalti payment ──────────────────────
exports.verifyGroupKhalti = async (req, res) => {
  try {
    const { pidx, pendingId, groupCartId } = req.body;

    const pendingPayment = await PendingPayment.findById(pendingId);
    if (!pendingPayment) return res.status(404).json({ success: false, message: 'Pending payment not found' });
    if (pendingPayment.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Already verified' });
    }

    // Lookup with Khalti
    const lookupResponse = await fetch(KHALTI_CONFIG.lookupUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pidx })
    });
    const lookupData = await lookupResponse.json();

    if (lookupData.status !== 'Completed') {
      pendingPayment.status = 'failed';
      await pendingPayment.save();
      return res.status(400).json({ success: false, message: 'Khalti payment not completed' });
    }

    pendingPayment.status = 'completed';
    await pendingPayment.save();

    // Mark the member as paid — prefer clean DB value
    const rawGcId = pendingPayment.groupCartId || (groupCartId ? groupCartId.split('?')[0] : null);
    if (!rawGcId) return res.status(400).json({ success: false, message: 'No group cart ID found' });
    const gcId = rawGcId.toString();
    const groupCart = await GroupCart.findById(gcId);
    if (!groupCart) return res.status(404).json({ success: false, message: 'Group cart not found' });

    const member = groupCart.members.find(m => m.user.toString() === req.user._id.toString());
    if (member) {
      member.paymentStatus = 'paid';
      member.paymentRef = pidx;
      await groupCart.save();
    }

    // Check if all paid
    const allPaid = groupCart.members.every(m => m.paymentStatus === 'paid');
    if (allPaid) {
      const populated = await populateGroupCart(gcId);
      const result = await createOrdersFromGroupCart(populated, 'khalti', 'paid');
      emitGroupCartUpdate(await populateGroupCart(gcId));
      return res.status(201).json({
        success: true,
        message: 'Payment verified! Group order placed.',
        data: { orderPlaced: true, ...result, groupCartId: gcId }
      });
    }

    const populated = await populateGroupCart(gcId);
    emitGroupCartUpdate(populated);
    res.status(200).json({
      success: true,
      message: 'Payment verified. Waiting for other members.',
      data: { orderPlaced: false, groupCartId: gcId }
    });
  } catch (error) {
    console.error('verifyGroupKhalti error:', error);
    res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
  }
};

// Keep old export name for backward compat
exports.placeGroupOrder = exports.initiateGroupOrder;
