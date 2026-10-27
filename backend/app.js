const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware: parse JSON request bodies up to 400 KB limit
app.use(express.json({ limit: '400kb' }));

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api', analyzeRoutes);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
