require("dotenv").config();

const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", require("./routes/analyzeRoutes"));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`DataShadow backend listening on port ${port}`);
  });
}

module.exports = app;
