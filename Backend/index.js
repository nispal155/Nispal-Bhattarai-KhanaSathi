const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const restaurantRoutes = require('./src/routes/restaurantRoutes');
const staffRoutes = require('./src/routes/staffRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const promoRoutes = require('./src/routes/promoRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const contentRoutes = require('./src/routes/contentRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const complaintRoutes = require('./src/routes/complaintRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => {
    res.send('KhanaSathi API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const http = require('http');
const socketService = require('./src/services/socket');

const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server);

const PORT = process.env.PORT || 5003;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
