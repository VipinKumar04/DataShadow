/**
 * Validation utility for analysis schema and evidence according to API Contract v1.
 */

function validateAnalysis(data) {
  const errors = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, errors: ["response must be an object"] };
  }

  const analysisFields = [
    "summary",
    "dataCollected",
    "sharing",
    "retention",
    "concerns",
    "recommendations",
    "limitations"
  ];

  for (const field of Object.keys(data)) {
    if (!analysisFields.includes(field)) {
      errors.push(`${field} is not an allowed analysis field`);
    }
  }

  for (const field of analysisFields) {
    if (!(field in data)) {
      errors.push(`${field} is a required analysis field`);
    }
  }

  if (typeof data.summary !== "string") {
    errors.push("summary must be a string");
  }

  const arrayFields = [
    "dataCollected",
    "sharing",
    "retention",
    "concerns",
    "recommendations",
    "limitations"
  ];

  for (const f of arrayFields) {
    if (!Array.isArray(data[f])) {
      errors.push(`${f} must be an array`);
    }
  }

  const checkFinding = (item, path, fields) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const allowedFields = [...fields, "evidence"];
    for (const field of Object.keys(item)) {
      if (!allowedFields.includes(field)) {
        errors.push(`${path}.${field} is not an allowed finding field`);
      }
    }
    for (const f of fields) {
      if (typeof item[f] !== "string") {
        errors.push(`${path}.${f} must be a string`);
      }
    }
    if (typeof item.evidence !== "string") {
      errors.push(`${path}.evidence must be a string`);
    }
  };

  if (Array.isArray(data.dataCollected)) {
    data.dataCollected.forEach((x, i) =>
      checkFinding(x, `dataCollected[${i}]`, ["category", "purpose"])
    );
  }

  if (Array.isArray(data.sharing)) {
    data.sharing.forEach((x, i) =>
      checkFinding(x, `sharing[${i}]`, ["recipient", "purpose"])
    );
  }

  if (Array.isArray(data.retention)) {
    data.retention.forEach((x, i) =>
      checkFinding(x, `retention[${i}]`, ["topic", "details"])
    );
  }

  if (Array.isArray(data.concerns)) {
    data.concerns.forEach((c, i) => {
      if (!c || typeof c !== "object" || Array.isArray(c)) {
        errors.push(`concerns[${i}] must be an object`);
        return;
      }
      for (const field of Object.keys(c)) {
        if (!["title", "severity", "explanation", "evidence"].includes(field)) {
          errors.push(`concerns[${i}].${field} is not an allowed finding field`);
        }
      }
      if (typeof c.title !== "string") errors.push(`concerns[${i}].title must be a string`);
      if (!["low", "medium", "high"].includes(c.severity)) {
        errors.push(`concerns[${i}].severity must be low|medium|high`);
      }
      if (typeof c.explanation !== "string") {
        errors.push(`concerns[${i}].explanation must be a string`);
      }
      if (typeof c.evidence !== "string") {
        errors.push(`concerns[${i}].evidence must be a string`);
      }
    });
  }

  if (
    Array.isArray(data.recommendations) &&
    data.recommendations.some((x) => typeof x !== "string")
  ) {
    errors.push("recommendations must be strings");
  }

  if (
    Array.isArray(data.limitations) &&
    data.limitations.some((x) => typeof x !== "string")
  ) {
    errors.push("limitations must be strings");
  }

  return { ok: errors.length === 0, errors };
}

function validateEvidence(data, policyText) {
  const errors = [];
  const check = (item, path) => {
    if (
      item &&
      typeof item.evidence === "string" &&
      item.evidence !== "" &&
      !policyText.includes(item.evidence)
    ) {
      errors.push(`${path}.evidence is not an exact substring of the policy text`);
    }
    if (item && (typeof item.evidence !== "string" || item.evidence === "")) {
      errors.push(`${path}.evidence must be non-empty`);
    }
  };

  (data.dataCollected || []).forEach((x, i) => check(x, `dataCollected[${i}]`));
  (data.sharing || []).forEach((x, i) => check(x, `sharing[${i}]`));
  (data.retention || []).forEach((x, i) => check(x, `retention[${i}]`));
  (data.concerns || []).forEach((c, i) => check(c, `concerns[${i}]`));
  return { ok: errors.length === 0, errors };
}

function filterVerifiedFindings(data, policyText) {
  const result = { ...data };
  for (const field of ["dataCollected", "sharing", "retention", "concerns"]) {
    result[field] = (data[field] || []).filter(
      (item) =>
        typeof item.evidence === "string" &&
        item.evidence.trim().length > 0 &&
        policyText.includes(item.evidence)
    );
  }
  return result;
}

module.exports = { validateAnalysis, validateEvidence, filterVerifiedFindings };
