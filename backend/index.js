require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://www.propabridge.ng',
    'https://www.propabridge.com.ng',
    'https://propabridge.ng',
    'https://propabridge.com.ng',
    'https://www.propabridge.com',
    'https://propabridge.com',
    'https://propabridge-vercel.vercel.app',
    'https://frontend-pi-ten-24.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Handle the root route by serving index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API Routes
const whatsappRoutes = require('./routes/whatsapp');
const authRoutes = require('./routes/auth');
const propertiesRoutes = require('./routes/properties');

app.use('/api/v1', whatsappRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertiesRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});
