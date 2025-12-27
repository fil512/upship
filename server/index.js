require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./db');
const { createSessionMiddleware } = require('./auth');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(createSessionMiddleware());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint for Railway (includes database status)
app.get('/health', async (req, res) => {
  const dbHealthy = await db.healthCheck();

  const status = {
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected'
  };

  res.status(dbHealthy ? 200 : 503).json(status);
});

// API endpoint placeholder
app.get('/api/status', (req, res) => {
  res.json({
    game: 'UP SHIP!',
    version: '1.0.0',
    status: 'development',
    description: 'A strategy board game about airship conglomerates during the Golden Age of Airships (1900-1937)'
  });
});

// Serve the main page for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UP SHIP! server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});
