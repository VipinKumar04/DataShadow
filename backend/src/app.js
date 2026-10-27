const express = require("express");
const rateLimit = require("./middleware/rateLimit");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "400kb" }));

app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
  }
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ success: false, error: { code: "REQUEST_TOO_LARGE", message: "Request body exceeds 400 KB." } });
  }
  return next(err);
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api", rateLimit);
app.use("/api", require("./routes/analyzeRoutes"));

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred. Please try again." } });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`DataShadow backend listening on port ${port}`);
  });
}

module.exports = app;
