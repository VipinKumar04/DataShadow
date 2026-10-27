const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  validateAnalysis,
  validateEvidence,
  filterVerifiedFindings
} = require("../backend/utils/validateAnalysis");

describe("validateAnalysis", () => {
  const valid = {
    summary: "A concise summary",
    dataCollected: [{ category: "c", purpose: "p", evidence: "e" }],
    sharing: [{ recipient: "r", purpose: "p", evidence: "e" }],
    retention: [{ topic: "t", details: "d", evidence: "e" }],
    concerns: [{ title: "t", severity: "low", explanation: "x", evidence: "e" }],
    recommendations: ["r"],
    limitations: ["l"]
  };

  test("valid response passes validation", () => {
    assert.strictEqual(validateAnalysis(valid).ok, true);
  });

  test("missing required field fails validation", () => {
    const { summary, ...rest } = valid;
    assert.strictEqual(validateAnalysis(rest).ok, false);
  });

  test("invalid concern severity fails validation", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.concerns[0].severity = "critical";
    assert.strictEqual(validateAnalysis(bad).ok, false);
  });

  test("empty evidence has a valid string shape and is removed before returning", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.dataCollected[0].evidence = "";
    assert.strictEqual(validateAnalysis(bad).ok, true);
    assert.deepStrictEqual(filterVerifiedFindings(bad, "e").dataCollected, []);
  });

  test("unexpected fields and alternative schema names are rejected", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.dataCollected[0].finding = "alternative field";
    assert.strictEqual(validateAnalysis(bad).ok, false);

    const bad2 = JSON.parse(JSON.stringify(valid));
    bad2.other = "unexpected";
    assert.strictEqual(validateAnalysis(bad2).ok, false);
  });

  test("wrong types fail validation", () => {
    const bad = JSON.parse(JSON.stringify(valid));
    bad.summary = 123;
    assert.strictEqual(validateAnalysis(bad).ok, false);
  });
});

describe("validateEvidence", () => {
  test("exact substring passes validation", () => {
    const data = {
      dataCollected: [{ category: "c", purpose: "p", evidence: "hello" }]
    };
    assert.strictEqual(validateEvidence(data, "say hello world").ok, true);
  });

  test("fabricated evidence fails validation", () => {
    const data = {
      dataCollected: [{ category: "c", purpose: "p", evidence: "nope" }]
    };
    assert.strictEqual(validateEvidence(data, "hello world").ok, false);
  });

  test("filters empty and fabricated excerpts from every finding category", () => {
    const data = {
      dataCollected: [{ evidence: "quote" }, { evidence: "invented" }],
      sharing: [{ evidence: "" }],
      retention: [{ evidence: "quote" }],
      concerns: [{ evidence: "invented" }]
    };
    const result = filterVerifiedFindings(data, "a quote");
    assert.deepStrictEqual(result.dataCollected, [{ evidence: "quote" }]);
    assert.deepStrictEqual(result.sharing, []);
    assert.deepStrictEqual(result.retention, [{ evidence: "quote" }]);
    assert.deepStrictEqual(result.concerns, []);
  });
});
