jest.mock("../src/services/aiAnalysisService", () => ({
  analyzePolicy: jest.fn(),
}));

const request = require("supertest");
const app = require("../src/app");
const { analyzePolicy } = require("../src/services/aiAnalysisService");

describe("POST /api/analyze", () => {
  beforeEach(() => jest.clearAllMocks());

  test("400 invalid request", async () => {
    const res = await request(app).post("/api/analyze").send({ policyText: "", language: "en" });
    expect(res.status).toBe(400);
  });

  test("400 language invalid", async () => {
    const res = await request(app).post("/api/analyze").send({ policyText: "hello", language: "fr" });
    expect(res.status).toBe(400);
  });

  test("200 valid analysis", async () => {
    analyzePolicy.mockResolvedValue({
      summary: "s",
      dataCollected: [{ finding: "f", evidence: "hello" }],
      sharing: [{ finding: "f", evidence: "" }],
      retention: [{ finding: "f", evidence: "" }],
      concerns: [{ title: "t", description: "d", severity: "low", evidence: "" }],
      recommendations: ["r"],
      limitations: ["l"],
    });
    const res = await request(app).post("/api/analyze").send({ policyText: "hello world", language: "en" });
    expect(res.status).toBe(200);
    expect(res.body.summary).toBe("s");
  });

  test("422 invalid model output", async () => {
    analyzePolicy.mockResolvedValue({ summary: "s" });
    const res = await request(app).post("/api/analyze").send({ policyText: "hello", language: "en" });
    expect(res.status).toBe(422);
  });

  test("503 missing config", async () => {
    analyzePolicy.mockRejectedValue(new Error("MISSING_CONFIG"));
    const res = await request(app).post("/api/analyze").send({ policyText: "hello", language: "en" });
    expect(res.status).toBe(503);
  });

  test("504 timeout", async () => {
    analyzePolicy.mockRejectedValue(new Error("TIMEOUT"));
    const res = await request(app).post("/api/analyze").send({ policyText: "hello", language: "en" });
    expect(res.status).toBe(504);
  });

  test("502 provider error", async () => {
    analyzePolicy.mockRejectedValue(new Error("PROVIDER"));
    const res = await request(app).post("/api/analyze").send({ policyText: "hello", language: "en" });
    expect(res.status).toBe(502);
  });
});
