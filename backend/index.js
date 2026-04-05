const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Import HTTP
const { Server } = require('socket.io'); // 2. Import Socket.io

// Your Route Imports
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');
const orderRoutes = require('./routes/orders');
const staffRoutes = require('./routes/staff');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const restaurantRoutes = require('./routes/restaurants');

const app = express();
const server = http.createServer(app); // 3. Create the HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }, // Allow mobile app connections
});

app.use(cors());
app.use(express.json());

// 4. Attach the 'io' instance to every request so routes can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 5. Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔥 User disconnected');
  });
});

// 6. LISTEN USING THE SERVER (Not app.listen)
server.listen(3000, () => console.log("🚀 Real-time Server ready on port 3000"));