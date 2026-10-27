const { validateAnalysis, validateEvidence } = require("../src/utils/validateAnalysis");

describe("validateAnalysis", () => {
  const valid = {
    summary: "s",
    dataCollected: [{ category: "c", purpose: "p", evidence: "e" }],
    sharing: [{ recipient: "r", purpose: "p", evidence: "e" }],
    retention: [{ topic: "t", details: "d", evidence: "e" }],
    concerns: [{ title: "t", severity: "low", explanation: "x", evidence: "e" }],
    recommendations: ["r"],
    limitations: ["l"],
  };
  test("valid response", () => expect(validateAnalysis(valid).ok).toBe(true));
  test("missing required field", () => {
    const { summary, ...rest } = valid;
    expect(validateAnalysis(rest).ok).toBe(false);
  });
  test("invalid severity", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.concerns[0].severity = "critical";
    expect(validateAnalysis(bad).ok).toBe(false);
  });
  test("empty evidence rejected", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.dataCollected[0].evidence = "";
    expect(validateAnalysis(bad).ok).toBe(false);
  });
  test("wrong types", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.summary = 123;
    expect(validateAnalysis(bad).ok).toBe(false);
  });
});

describe("validateEvidence", () => {
  test("exact substring passes", () => {
    const data = { dataCollected: [{ category: "c", purpose: "p", evidence: "hello" }] };
    expect(validateEvidence(data, "say hello world").ok).toBe(true);
  });
  test("fabricated evidence fails", () => {
    const data = { dataCollected: [{ category: "c", purpose: "p", evidence: "nope" }] };
    expect(validateEvidence(data, "hello world").ok).toBe(false);
  });
});
