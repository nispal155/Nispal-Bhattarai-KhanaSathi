const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Menu = require('../models/Menu');
const PendingPayment = require('../models/PendingPayment');
const crypto = require('crypto');

// eSewa Configuration (sandbox/test environment)
const ESEWA_CONFIG = {
    merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
    secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
    // Sandbox URL for testing, change to live URL in production
    paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    verifyUrl: process.env.ESEWA_VERIFY_URL || 'https://rc-epay.esewa.com.np/api/epay/transaction/status/'
};

// Khalti Configuration (sandbox/test environment)
const KHALTI_CONFIG = {
    secretKey: process.env.KHALTI_SECRET_KEY || 'test_secret_key_placeholder',
    publicKey: process.env.KHALTI_PUBLIC_KEY || 'test_public_key_placeholder',
    initiateUrl: process.env.KHALTI_INITIATE_URL || 'https://a.khalti.com/api/v2/epayment/initiate/',
    lookupUrl: process.env.KHALTI_LOOKUP_URL || 'https://a.khalti.com/api/v2/epayment/lookup/'
};

/**
 * Generate eSewa signature (HMAC-SHA256)
 */
const generateEsewaSignature = (message) => {
    return crypto
        .createHmac('sha256', ESEWA_CONFIG.secretKey)
        .update(message)
        .digest('base64');
};

/**
 * Helper function to calculate cart totals
 */
const calculateCartTotals = (cart, useLoyaltyPoints, userLoyaltyPoints) => {
    let subtotal = 0;
    for (const group of cart.restaurantGroups) {
        for (const item of group.items) {
            subtotal += item.price * item.quantity;
        }
    }
    
    const deliveryFee = cart.restaurantGroups.length * 50;
    const serviceFee = 20;
    const promoDiscount = cart.promoDiscount || 0;
    
    let loyaltyDiscount = 0;
    if (useLoyaltyPoints && userLoyaltyPoints > 0) {
        const remainingTotal = subtotal + deliveryFee + serviceFee - promoDiscount;
        loyaltyDiscount = Math.min(userLoyaltyPoints, remainingTotal);
    }
    
    const total = Math.max(0, subtotal + deliveryFee + serviceFee - promoDiscount - loyaltyDiscount);
    
    return { subtotal, deliveryFee, serviceFee, promoDiscount, loyaltyDiscount, total };
};

/**
 * Helper function to create orders from pending payment
 */
const createOrdersFromPendingPayment = async (pendingPayment, paymentRef, paymentMethod) => {
    const user = await User.findById(pendingPayment.user);
    const cart = pendingPayment.cartData;
    
    const createdOrders = [];
    let totalOrderValue = 0;
    let pointsToDeduct = pendingPayment.useLoyaltyPoints ? user.loyaltyPoints : 0;
    
    for (const group of cart.restaurantGroups) {
        const subtotal = group.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const deliveryFee = 50;
        const serviceFee = 20;
        const discount = (createdOrders.length === 0) ? (cart.promoDiscount || 0) : 0;
        
        let pointsDiscount = 0;
        if (pointsToDeduct > 0) {
            const remainingGroupTotal = subtotal + deliveryFee + serviceFee - discount;
            pointsDiscount = Math.min(pointsToDeduct, remainingGroupTotal);
            pointsToDeduct -= pointsDiscount;
        }
        
        const total = subtotal + deliveryFee + serviceFee - discount - pointsDiscount;
        totalOrderValue += total;
        
        const order = await Order.create({
            customer: pendingPayment.user,
            restaurant: group.restaurant,
            items: group.items.map(item => ({
                menuItem: item.menuItem,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
            })),
            status: 'pending',
            deliveryAddress: pendingPayment.deliveryAddress,
            pricing: {
                subtotal,
                deliveryFee,
                serviceFee,
                discount: discount + pointsDiscount,
                total
            },
            paymentMethod,
            paymentStatus: 'paid', // Already paid via gateway
            specialInstructions: pendingPayment.specialInstructions,
            promoCode: (createdOrders.length === 0) ? cart.promoCode : undefined,
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
            statusHistory: [{
                status: 'payment_completed',
                note: `${paymentMethod} payment successful. Ref: ${paymentRef}`
            }]
        });
        
        // Set payment reference based on method
        if (paymentMethod === 'esewa') {
            order.esewaRefId = paymentRef;
        } else if (paymentMethod === 'khalti') {
            order.khaltiRefId = paymentRef;
        }
        await order.save();
        
        // Update menu item order counts
        for (const item of group.items) {
            await Menu.findByIdAndUpdate(item.menuItem, {
                $inc: { orderCount: item.quantity }
            });
        }
        
        createdOrders.push(order);
    }
    
    // Calculate and update loyalty points
    const pointsEarned = Math.floor(totalOrderValue / 100);
    const initialLoyaltyPoints = user.loyaltyPoints;
    const netPointsChange = pointsEarned - (pendingPayment.useLoyaltyPoints ? initialLoyaltyPoints : 0);
    
    await User.findByIdAndUpdate(pendingPayment.user, {
        $inc: { loyaltyPoints: netPointsChange }
    });
    
    // Clear the user's cart
    await Cart.findOneAndDelete({ user: pendingPayment.user });
    
    // Create notifications for restaurants
    const Notification = require('../models/Notification');
    for (const order of createdOrders) {
        try {
            await Notification.create({
                user: order.restaurant,
                type: 'order_status',
                title: 'New Order Received',
                message: `You have a new order #${order.orderNumber}`,
                data: { orderId: order._id }
            });
        } catch (notifError) {
            console.error(`Failed to create notification for order ${order._id}:`, notifError.message);
        }
    }
    
    return createdOrders;
};

/**
 * @desc    Initiate eSewa payment from cart (before order creation)
 * @route   POST /api/payment/esewa/initiate-from-cart
 * @access  Private
 */
exports.initiateEsewaFromCart = async (req, res) => {
    try {
        const { deliveryAddress, specialInstructions, useLoyaltyPoints } = req.body;
        console.log('=== ESEWA INITIATE FROM CART ===');
        console.log('User ID:', req.user._id);
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id }).populate('restaurantGroups.items.menuItem');
        if (!cart || cart.restaurantGroups.length === 0) {
            console.log('Cart is empty for user:', req.user._id);
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        console.log('Cart found with', cart.restaurantGroups.length, 'restaurant groups');

        const user = await User.findById(req.user._id);
        const { total } = calculateCartTotals(cart, useLoyaltyPoints, user.loyaltyPoints);
        console.log('Total amount:', total);

        // Create pending payment record
        const transactionUuid = `ESEWA-${req.user._id}-${Date.now()}`;
        
        const pendingPayment = await PendingPayment.create({
            user: req.user._id,
            cartData: {
                restaurantGroups: cart.restaurantGroups.map(group => ({
                    restaurant: group.restaurant,
                    items: group.items.map(item => ({
                        menuItem: item.menuItem?._id || item.menuItem,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image,
                        specialInstructions: item.specialInstructions
                    }))
                })),
                promoCode: cart.promoCode,
                promoDiscount: cart.promoDiscount
            },
            deliveryAddress,
            paymentMethod: 'esewa',
            specialInstructions,
            useLoyaltyPoints,
            transactionId: transactionUuid,
            totalAmount: total
        });

        // Generate eSewa signature
        const signatureMessage = `total_amount=${total},transaction_uuid=${transactionUuid},product_code=${ESEWA_CONFIG.merchantCode}`;
        const signature = generateEsewaSignature(signatureMessage);

        const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=esewa&status=success`;
        const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=esewa&status=failure`;

        console.log('eSewa payment initiated:', {
            pendingPaymentId: pendingPayment._id,
            transactionUuid,
            total
        });

        res.status(200).json({
            success: true,
            data: {
                paymentUrl: ESEWA_CONFIG.paymentUrl,
                formData: {
                    amount: total.toString(),
                    tax_amount: '0',
                    total_amount: total.toString(),
                    transaction_uuid: transactionUuid,
                    product_code: ESEWA_CONFIG.merchantCode,
                    product_service_charge: '0',
                    product_delivery_charge: '0',
                    success_url: successUrl,
                    failure_url: failureUrl,
                    signed_field_names: 'total_amount,transaction_uuid,product_code',
                    signature: signature
                }
            }
        });
    } catch (error) {
        console.error('eSewa payment initiation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate eSewa payment',
            error: error.message
        });
    }
};

/**
 * @desc    Initiate Khalti payment from cart (before order creation)
 * @route   POST /api/payment/khalti/initiate-from-cart
 * @access  Private
 */
exports.initiateKhaltiFromCart = async (req, res) => {
    try {
        const { deliveryAddress, specialInstructions, useLoyaltyPoints } = req.body;
        console.log('=== KHALTI INITIATE FROM CART ===');
        console.log('User ID:', req.user._id);
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id }).populate('restaurantGroups.items.menuItem');
        if (!cart || cart.restaurantGroups.length === 0) {
            console.log('Cart is empty for user:', req.user._id);
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        console.log('Cart found with', cart.restaurantGroups.length, 'restaurant groups');

        const user = await User.findById(req.user._id);
        const { total } = calculateCartTotals(cart, useLoyaltyPoints, user.loyaltyPoints);

        // Get restaurant name for display
        const Restaurant = require('../models/Restaurant');
        const firstRestaurant = await Restaurant.findById(cart.restaurantGroups[0].restaurant);
        const restaurantName = firstRestaurant?.name || 'KhanaSathi';

        // Create pending payment record first
        const pendingPayment = await PendingPayment.create({
            user: req.user._id,
            cartData: {
                restaurantGroups: cart.restaurantGroups.map(group => ({
                    restaurant: group.restaurant,
                    items: group.items.map(item => ({
                        menuItem: item.menuItem?._id || item.menuItem,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image,
                        specialInstructions: item.specialInstructions
                    }))
                })),
                promoCode: cart.promoCode,
                promoDiscount: cart.promoDiscount
            },
            deliveryAddress,
            paymentMethod: 'khalti',
            specialInstructions,
            useLoyaltyPoints,
            totalAmount: total
        });

        // Khalti expects amount in paisa (1 NPR = 100 paisa)
        const amountInPaisa = Math.round(total * 100);
        const purchaseOrderId = `KS-${pendingPayment._id}`;

        const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=khalti&pendingId=${pendingPayment._id}`;
        const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const payload = {
            return_url: returnUrl,
            website_url: websiteUrl,
            amount: amountInPaisa,
            purchase_order_id: purchaseOrderId,
            purchase_order_name: `Order from ${restaurantName}`,
            customer_info: {
                name: user.username,
                email: user.email,
                phone: user.phone || '9800000000'
            }
        };

        console.log('Khalti request payload:', JSON.stringify(payload, null, 2));

        // Call Khalti API
        const response = await fetch(KHALTI_CONFIG.initiateUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const khaltiResponse = await response.json();
        console.log('Khalti API response:', JSON.stringify(khaltiResponse, null, 2));

        if (response.ok && khaltiResponse.payment_url) {
            // Update pending payment with Khalti pidx
            pendingPayment.transactionId = khaltiResponse.pidx;
            await pendingPayment.save();

            return res.status(200).json({
                success: true,
                data: {
                    paymentUrl: khaltiResponse.payment_url,
                    pidx: khaltiResponse.pidx
                }
            });
        } else {
            // Delete pending payment on failure
            await PendingPayment.findByIdAndDelete(pendingPayment._id);
            
            console.error('Khalti initiation failed:', khaltiResponse);
            return res.status(400).json({
                success: false,
                message: khaltiResponse.detail || khaltiResponse.error_key || 'Failed to initiate Khalti payment',
                details: khaltiResponse
            });
        }
    } catch (error) {
        console.error('Khalti payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate Khalti payment',
            error: error.message
        });
    }
};

/**
 * @desc    Verify eSewa payment and create order
 * @route   POST /api/payment/esewa/verify
 * @access  Private
 */
exports.verifyEsewaPayment = async (req, res) => {
    try {
        const { data } = req.body; // Base64 encoded response from eSewa

        if (!data) {
            return res.status(400).json({ success: false, message: 'No payment data received' });
        }

        // Decode the base64 response
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        console.log('eSewa decoded data:', decodedData);
        const { transaction_uuid, status, total_amount, transaction_code } = decodedData;

        // Find pending payment by transaction UUID
        const pendingPayment = await PendingPayment.findOne({ transactionId: transaction_uuid });

        if (!pendingPayment) {
            return res.status(404).json({ success: false, message: 'Pending payment not found' });
        }

        if (status === 'COMPLETE') {
            // Create orders from pending payment
            const orders = await createOrdersFromPendingPayment(pendingPayment, transaction_code, 'esewa');
            
            // Mark pending payment as completed
            pendingPayment.status = 'completed';
            await pendingPayment.save();

            return res.status(200).json({
                success: true,
                message: 'Payment verified and order created successfully',
                data: { 
                    orderId: orders[0]._id, 
                    orders: orders.map(o => o._id),
                    paymentStatus: 'paid' 
                }
            });
        } else {
            pendingPayment.status = 'failed';
            await pendingPayment.save();

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('eSewa verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify eSewa payment',
            error: error.message
        });
    }
};

/**
 * @desc    Verify Khalti payment and create order
 * @route   POST /api/payment/khalti/verify
 * @access  Private
 */
exports.verifyKhaltiPayment = async (req, res) => {
    try {
        const { pidx, pendingId } = req.body;
        console.log('Verifying Khalti payment:', { pidx, pendingId });

        // Find pending payment
        const pendingPayment = await PendingPayment.findById(pendingId);
        if (!pendingPayment) {
            return res.status(404).json({ success: false, message: 'Pending payment not found' });
        }

        // Verify with Khalti
        const response = await fetch(KHALTI_CONFIG.lookupUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pidx })
        });

        const khaltiResponse = await response.json();
        console.log('Khalti verification response:', khaltiResponse);

        if (khaltiResponse.status === 'Completed') {
            // Create orders from pending payment
            const orders = await createOrdersFromPendingPayment(pendingPayment, khaltiResponse.transaction_id, 'khalti');
            
            // Mark pending payment as completed
            pendingPayment.status = 'completed';
            await pendingPayment.save();

            return res.status(200).json({
                success: true,
                message: 'Payment verified and order created successfully',
                data: { 
                    orderId: orders[0]._id,
                    orders: orders.map(o => o._id),
                    paymentStatus: 'paid' 
                }
            });
        } else {
            pendingPayment.status = 'failed';
            await pendingPayment.save();

            return res.status(400).json({
                success: false,
                message: `Payment ${khaltiResponse.status}`
            });
        }
    } catch (error) {
        console.error('Khalti verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify Khalti payment',
            error: error.message
        });
    }
};

// Keep old methods for backward compatibility with existing orders
/**
 * @desc    Initiate eSewa payment for existing order (legacy)
 * @route   POST /api/payment/esewa/initiate
 * @access  Private
 */
exports.initiateEsewaPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        console.log('Initiating eSewa payment for order:', orderId);

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const amount = order.pricing.total;
        const transactionUuid = `${order._id}-${Date.now()}`;

        const signatureMessage = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${ESEWA_CONFIG.merchantCode}`;
        const signature = generateEsewaSignature(signatureMessage);

        order.esewaTransactionId = transactionUuid;
        await order.save();

        const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=esewa&status=success`;
        const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=esewa&status=failure`;

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
                    signature: signature
                }
            }
        });
    } catch (error) {
        console.error('eSewa payment initiation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate eSewa payment',
            error: error.message
        });
    }
};

/**
 * @desc    Initiate Khalti payment for existing order (legacy)
 * @route   POST /api/payment/khalti/initiate
 * @access  Private
 */
exports.initiateKhaltiPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId)
            .populate('customer', 'username email phone')
            .populate('restaurant', 'name');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const amountInPaisa = Math.round(order.pricing.total * 100);
        const purchaseOrderId = `KS-${order.orderNumber}`;
        const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback?method=khalti&orderId=${order._id}`;
        const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const payload = {
            return_url: returnUrl,
            website_url: websiteUrl,
            amount: amountInPaisa,
            purchase_order_id: purchaseOrderId,
            purchase_order_name: `Order from ${order.restaurant.name}`,
            customer_info: {
                name: order.customer.username,
                email: order.customer.email,
                phone: order.customer.phone || '9800000000'
            }
        };

        const response = await fetch(KHALTI_CONFIG.initiateUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const khaltiResponse = await response.json();

        if (response.ok && khaltiResponse.payment_url) {
            order.khaltiPidx = khaltiResponse.pidx;
            await order.save();

            return res.status(200).json({
                success: true,
                data: {
                    paymentUrl: khaltiResponse.payment_url,
                    pidx: khaltiResponse.pidx
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: khaltiResponse.detail || 'Failed to initiate Khalti payment'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to initiate Khalti payment',
            error: error.message
        });
    }
};

/**
 * @desc    Get payment status for an order
 * @route   GET /api/payment/:orderId/status
 * @access  Private
 */
exports.getPaymentStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).select('paymentStatus paymentMethod');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get payment status',
            error: error.message
        });
    }
};
