const express = require('express');
const cors = require('cors'); // Add this
const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');
const orderRoutes = require('./routes/orders');
const staffRoutes = require('./routes/staff'); // Add this

const app = express();
app.use(cors()); // Enable CORS for the mobile app
app.use(express.json());    

app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes); // Add this

app.listen(3000, () => console.log("Server ready on port 3000"));