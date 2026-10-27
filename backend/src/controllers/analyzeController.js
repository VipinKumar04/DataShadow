const { analyzePolicy } = require("../services/aiAnalysisService");
const { validateAnalysis, validateEvidence } = require("../utils/validateAnalysis");

async function analyze(req, res) {
  const ct = req.headers["content-type"] || "";
  if (!ct.includes("application/json")) {
    return res.status(415).json({ success: false, error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Content-Type must be application/json." } });
  }
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Request body must be a JSON object." } });
  }
  const allowed = ["policyText", "language"];
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length) {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Unknown properties are not allowed." } });
  }

  const { policyText, language } = body;
  const maxLen = Number(process.env.MAX_POLICY_TEXT_LENGTH) || 50000;

  if (typeof policyText !== "string" || policyText.trim() === "") {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "policyText must be a non-empty string." } });
  }
  if (policyText.length > maxLen) {
    return res.status(413).json({ success: false, error: { code: "POLICY_TOO_LONG", message: `The policy text must not exceed ${maxLen} characters.` } });
  }
  if (typeof language !== "string") {
    return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "language is required." } });
  }
  if (language !== "en" && language !== "hi") {
    return res.status(422).json({ success: false, error: { code: "UNSUPPORTED_LANGUAGE", message: "Language must be either 'en' or 'hi'." } });
  }

  try {
    const result = await analyzePolicy({ policyText, language });
    const schema = validateAnalysis(result);
    if (!schema.ok) {
      return res.status(502).json({ success: false, error: { code: "AI_INVALID_RESPONSE", message: "The model response could not be validated." } });
    }
    const ev = validateEvidence(result, policyText);
    if (!ev.ok) {
      return res.status(502).json({ success: false, error: { code: "AI_INVALID_RESPONSE", message: "Evidence could not be verified." } });
    }
    return res.status(200).json({ success: true, analysis: result });
  } catch (err) {
    const msg = err && err.message;
    if (msg === "MISSING_CONFIG") return res.status(503).json({ success: false, error: { code: "AI_PROVIDER_UNAVAILABLE", message: "Server configuration is incomplete." } });
    if (msg === "TIMEOUT") return res.status(504).json({ success: false, error: { code: "AI_TIMEOUT", message: "Analysis took too long. Please try again." } });
    if (msg === "INVALID_MODEL_OUTPUT") return res.status(502).json({ success: false, error: { code: "AI_INVALID_RESPONSE", message: "The model returned invalid output." } });
    return res.status(503).json({ success: false, error: { code: "AI_PROVIDER_UNAVAILABLE", message: "AI provider unavailable." } });
  }
}

module.exports = { analyze };
