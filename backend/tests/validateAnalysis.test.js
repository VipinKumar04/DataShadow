const { validateAnalysis, validateEvidence, filterVerifiedFindings } = require("../src/utils/validateAnalysis");

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
  test("empty evidence has a valid string shape and is removed before returning", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.dataCollected[0].evidence = "";
    expect(validateAnalysis(bad).ok).toBe(true);
    expect(filterVerifiedFindings(bad, "e").dataCollected).toEqual([]);
  });
  test("unexpected fields and alternative schema names are rejected", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.dataCollected[0].finding = "alternative field";
    expect(validateAnalysis(bad).ok).toBe(false);
    bad.dataCollected[0] = { category: "c", purpose: "p", evidence: "e" };
    bad.other = "unexpected";
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
  test("filters empty and fabricated excerpts from every finding category", () => {
    const data = {
      dataCollected: [{ evidence: "quote" }, { evidence: "invented" }],
      sharing: [{ evidence: "" }],
      retention: [{ evidence: "quote" }],
      concerns: [{ evidence: "invented" }],
    };
    const result = filterVerifiedFindings(data, "a quote");
    expect(result.dataCollected).toEqual([{ evidence: "quote" }]);
    expect(result.sharing).toEqual([]);
    expect(result.retention).toEqual([{ evidence: "quote" }]);
    expect(result.concerns).toEqual([]);
  });
});
