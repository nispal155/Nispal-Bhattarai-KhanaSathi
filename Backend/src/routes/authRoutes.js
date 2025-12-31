const express = require('express');
const router = express.Router();
const { registerUser, authUser, verifyOTP, resendOTP, forgotPassword, resetPassword, logoutUser } = require('../controller/authController');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', logoutUser);

module.exports = router;
