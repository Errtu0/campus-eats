require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const path = require('path'); // Added for static files

// Route Imports
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');
const orderRoutes = require('./routes/orders');
const staffRoutes = require('./routes/staff');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const restaurantRoutes = require('./routes/restaurants');
const superadminRoutes = require('./routes/superadmin');

const PORT = 3000;
const app = express();
const server = http.createServer(app); 

// Socket.io Setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());

// 1. SERVE STATIC FILES (This is where your custom-brutalism.css goes!)
app.use(express.static(path.join(__dirname, 'public')));

// 2. ATTACH SOCKET.IO GLOBALLY
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 3. MOUNT SUPERADMIN *BEFORE* EXPRESS.JSON()
// AdminJS handles its own body parsing. If express.json() runs first, AdminJS forms break.
app.use('/api/superadmin', superadminRoutes);

// 4. NOW APPLY GLOBAL BODY PARSERS FOR THE REST OF THE APP
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. MOUNT REMAINING ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔥 User disconnected');
  });
});

// 6. START THE HTTP SERVER (Only call listen ONCE, on the 'server' object)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Real-time CampusEats Server ready on port ${PORT}`);
});