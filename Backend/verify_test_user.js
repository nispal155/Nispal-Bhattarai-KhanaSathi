const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function verifyUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'test@example.com' });
        if (user) {
            user.isVerified = true;
            await user.save();
            console.log('User verified successfully');
        } else {
            console.log('User not found');
        }
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

verifyUser();
