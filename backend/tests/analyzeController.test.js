jest.mock("../src/services/aiAnalysisService", () => ({
  analyzePolicy: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const { analyzePolicy } = require("../src/services/aiAnalysisService");

const validResult = {
  summary: "s",
  dataCollected: [{ category: "c", purpose: "p", evidence: "hello" }],
  sharing: [{ recipient: "r", purpose: "p", evidence: "" }],
  retention: [{ topic: "t", details: "d", evidence: "" }],
  concerns: [{ title: "t", severity: "low", explanation: "x", evidence: "" }],
  recommendations: ["r"],
  limitations: ["l"],
};

describe("POST /api/analyze", () => {
  beforeEach(() => jest.clearAllMocks());

  test("400 invalid request (empty policyText)", async () => {
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: "", language: "en" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("400 unknown property", async () => {
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: "hello", language: "en", foo: 1 });
    expect(res.status).toBe(400);
  });

  test("415 wrong content type", async () => {
    const res = await request(app).post("/api/analyze").set("Content-Type", "text/plain").send("hello");
    expect(res.status).toBe(415);
  });

  test("422 unsupported language", async () => {
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: "hello", language: "fr" });
    expect(res.status).toBe(422);
  });

  test("413 policy too long", async () => {
    const long = "a".repeat(50001);
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: long, language: "en" });
    expect(res.status).toBe(413);
  });

  test("200 valid analysis", async () => {
    // evidence non-empty for dataCollected; others empty evidence would fail validation, so make all non-empty matching
    const result = JSON.parse(JSON.stringify(validResult));
    result.sharing[0].evidence = "hello";
    result.retention[0].evidence = "hello";
    result.concerns[0].evidence = "hello";
    analyzePolicy.mockResolvedValue(result);
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: "hello world", language: "en" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis.summary).toBe("s");
  });

  test("502 invalid model output", async () => {
    analyzePolicy.mockResolvedValue({ summary: "s" });
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: "hello", language: "en" });
    expect(res.status).toBe(502);
  });

  test("503 missing config", async () => {
    analyzePolicy.mockRejectedValue(new Error("MISSING_CONFIG"));
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: "hello", language: "en" });
    expect(res.status).toBe(503);
  });

  test("504 timeout", async () => {
    analyzePolicy.mockRejectedValue(new Error("TIMEOUT"));
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: "hello", language: "en" });
    expect(res.status).toBe(504);
  });

  test("503 provider error", async () => {
    analyzePolicy.mockRejectedValue(new Error("PROVIDER"));
    const res = await request(app).post("/api/analyze").set("Content-Type", "application/json").send({ policyText: "hello", language: "en" });
    expect(res.status).toBe(503);
  });
});

describe("GET /api/health", () => {
  test("returns success", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, status: "ok" });
  });
});
