const express = require("express");
const { analyze } = require("../controllers/analyzeController");

const router = express.Router();
router.post("/analyze", analyze);

module.exports = router;
