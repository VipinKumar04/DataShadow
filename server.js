const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend', 'views'));

// Serve static assets from frontend/public
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Root route: Renders the frontend UI view
app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'DataShadow AI - Privacy Policy Analyzer'
  });
});

// Start preview server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DataShadow AI frontend preview running at http://localhost:${PORT}`);
  });
}

module.exports = app;
