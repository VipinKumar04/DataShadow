const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`DataShadow backend server running on http://localhost:${PORT}`);
});

module.exports = server;
