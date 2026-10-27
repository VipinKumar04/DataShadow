const express = require('express');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Middleware: parse JSON request bodies
app.use(express.json());

// Routes
app.use('/api', healthRoutes);

module.exports = app;
