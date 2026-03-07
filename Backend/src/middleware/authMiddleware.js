const jwt = require('jsonwebtoken');
const User = require('../models/User');

const CHILD_PENDING_ALLOWED_ROUTES = [
    { method: 'GET', path: '/api/users/profile' },
    { method: 'PUT', path: '/api/users/profile' },
    { method: 'POST', path: '/api/users/child-onboarding' }
];

const isChildPendingAllowedRoute = (req) => {
    const requestPath = req.originalUrl.split('?')[0];
    return CHILD_PENDING_ALLOWED_ROUTES.some(
        (route) => route.method === req.method && route.path === requestPath
    );
};

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            if (
                req.user.role === 'child' &&
                (!req.user.isProfileComplete || !req.user.isApproved) &&
                !isChildPendingAllowedRoute(req)
            ) {
                return res.status(403).json({
                    message: req.user.isProfileComplete
                        ? 'Child account is pending admin approval.'
                        : 'Child onboarding is incomplete. Please complete onboarding first.',
                    code: 'CHILD_VERIFICATION_PENDING',
                    isProfileComplete: req.user.isProfileComplete,
                    isApproved: req.user.isApproved
                });
            }

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token' });
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user is admin
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

// Check if user is restaurant manager
const restaurantManager = (req, res, next) => {
    if (req.user && req.user.role === 'restaurant') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as restaurant manager' });
    }
};

// Check if user is delivery staff
const deliveryStaff = (req, res, next) => {
    if (req.user && req.user.role === 'delivery_staff') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as delivery staff' });
    }
};

// Check if user is customer
const customer = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as customer' });
    }
};

module.exports = { protect, authorize, admin, restaurantManager, deliveryStaff, customer };
