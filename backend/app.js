const path = require('path');
const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// View engine setup: EJS views from frontend/views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));

// Serve static frontend assets from frontend/public
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Middleware: parse JSON request bodies up to 400 KB limit
app.use(express.json({ limit: '400kb' }));

// Root route: Renders the frontend UI view
app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'DataShadow AI - Privacy Policy Analyzer'
  });
});

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api', analyzeRoutes);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
