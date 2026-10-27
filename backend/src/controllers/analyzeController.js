const { analyzePolicy } = require("../services/aiAnalysisService");
const { validateAnalysis, validateEvidence } = require("../utils/validateAnalysis");

async function analyze(req, res) {
  const { policyText, language } = req.body || {};
  const maxLen = Number(process.env.MAX_POLICY_TEXT_LENGTH) || 50000;

  if (typeof policyText !== "string" || policyText.trim() === "") {
    return res.status(400).json({ error: { code: "INVALID_REQUEST", message: "policyText must be a non-empty string" } });
  }
  if (policyText.length > maxLen) {
    return res.status(400).json({ error: { code: "POLICY_TOO_LONG", message: "policyText exceeds maximum length" } });
  }
  if (language !== "en" && language !== "hi") {
    return res.status(400).json({ error: { code: "INVALID_LANGUAGE", message: "language must be en or hi" } });
  }

  try {
    const result = await analyzePolicy(policyText, language);
    const schema = validateAnalysis(result);
    if (!schema.ok) {
      return res.status(422).json({ error: { code: "INVALID_MODEL_OUTPUT", message: schema.errors.join("; ") } });
    }
    const ev = validateEvidence(result, policyText);
    if (!ev.ok) {
      return res.status(422).json({ error: { code: "INVALID_EVIDENCE", message: ev.errors.join("; ") } });
    }
    return res.status(200).json(result);
  } catch (err) {
    const msg = err && err.message;
    if (msg === "MISSING_CONFIG") return res.status(503).json({ error: { code: "MISSING_CONFIG", message: "Server configuration is incomplete" } });
    if (msg === "TIMEOUT") return res.status(504).json({ error: { code: "TIMEOUT", message: "AI request timed out" } });
    if (msg === "INVALID_MODEL_OUTPUT") return res.status(422).json({ error: { code: "INVALID_MODEL_OUTPUT", message: "Model returned invalid output" } });
    return res.status(502).json({ error: { code: "PROVIDER_ERROR", message: "AI provider error" } });
  }
}

module.exports = { analyze };
