process.env.NODE_ENV = "test";
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const app = require("../backend/app");
const { setClient } = require("../backend/services/aiAnalysisService");

const samplePolicy =
  "We collect your email address to provide customer support. We share your email with notification providers. We keep support logs for 90 days.";

const mockValidAnalysis = {
  summary: "This policy describes customer support data collection.",
  dataCollected: [
    {
      category: "Contact info",
      purpose: "Customer support",
      evidence: "We collect your email address to provide customer support."
    }
  ],
  sharing: [
    {
      recipient: "Notification providers",
      purpose: "Sending notifications",
      evidence: "We share your email with notification providers."
    }
  ],
  retention: [
    {
      topic: "Support logs",
      details: "Retained for 90 days",
      evidence: "We keep support logs for 90 days."
    }
  ],
  concerns: [
    {
      title: "Third-party sharing",
      severity: "low",
      explanation: "Email is shared with notification providers.",
      evidence: "We share your email with notification providers."
    }
  ],
  recommendations: ["Review notification settings."],
  limitations: ["Based only on supplied policy text."]
};

describe("POST /api/analyze - AI Integration E2E", () => {
  let server;
  let baseUrl;
  let mockHandler;

  before((_, done) => {
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "test-model";

    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  after((_, done) => {
    setClient(null);
    server.close(done);
  });

  beforeEach(() => {
    mockHandler = async () => ({
      text: JSON.stringify(mockValidAnalysis)
    });
    setClient({
      models: {
        generateContent: (args) => mockHandler(args)
      }
    });
  });

  test("returns HTTP 200 with full analysis envelope for valid English request", async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyText: samplePolicy, language: "en" })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.analysis);
    assert.strictEqual(
      data.analysis.summary,
      "This policy describes customer support data collection."
    );
    assert.strictEqual(data.analysis.dataCollected.length, 1);
    assert.strictEqual(data.analysis.sharing.length, 1);
    assert.strictEqual(data.analysis.retention.length, 1);
    assert.strictEqual(data.analysis.concerns.length, 1);
    assert.ok(Array.isArray(data.analysis.recommendations));
    assert.ok(Array.isArray(data.analysis.limitations));
  });

  test("returns HTTP 200 for valid Hindi request", async () => {
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyText: samplePolicy, language: "hi" })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.analysis);
  });

  test("filters unverified findings and preserves empty arrays", async () => {
    const unverifiedAnalysis = {
      ...mockValidAnalysis,
      dataCollected: [
        {
          category: "Location",
          purpose: "Tracking",
          evidence: "This excerpt is NOT in the policy text."
        }
      ]
    };
    mockHandler = async () => ({
      text: JSON.stringify(unverifiedAnalysis)
    });

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyText: samplePolicy, language: "en" })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.deepStrictEqual(data.analysis.dataCollected, []);
  });

  test("maps AI timeout to HTTP 504 AI_TIMEOUT", async () => {
    mockHandler = () => new Promise(() => {}); // never resolves
    process.env.AI_REQUEST_TIMEOUT_MS = "50";

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyText: samplePolicy, language: "en" })
    });

    process.env.AI_REQUEST_TIMEOUT_MS = "60000";
    assert.strictEqual(res.status, 504);
    const data = await res.json();
    assert.deepStrictEqual(data, {
      success: false,
      error: {
        code: "AI_TIMEOUT",
        message: "Analysis took too long. Please try again."
      }
    });
  });

  test("maps invalid AI output to HTTP 502 AI_INVALID_RESPONSE", async () => {
    mockHandler = async () => ({ text: "{ malformed json" });

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyText: samplePolicy, language: "en" })
    });

    assert.strictEqual(res.status, 502);
    const data = await res.json();
    assert.deepStrictEqual(data, {
      success: false,
      error: {
        code: "AI_INVALID_RESPONSE",
        message: "The model response could not be validated. Please try again."
      }
    });
  });

  test("maps provider failure to HTTP 503 AI_PROVIDER_UNAVAILABLE", async () => {
    mockHandler = async () => {
      throw new Error("Quota exceeded or connection reset");
    };

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyText: samplePolicy, language: "en" })
    });

    assert.strictEqual(res.status, 503);
    const data = await res.json();
    assert.deepStrictEqual(data, {
      success: false,
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "Analysis is temporarily unavailable. Please try again."
      }
    });
  });
});
