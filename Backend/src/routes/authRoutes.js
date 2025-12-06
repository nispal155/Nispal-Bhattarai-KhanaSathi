const express = require('express');
const router = express.Router();
const { registerUser, authUser, verifyOTP, resendOTP, forgotPassword, resetPassword } = require('../controller/authController');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
