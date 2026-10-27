function validateAnalysis(data) {
  const errors = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, errors: ["response must be an object"] };
  }
  if (typeof data.summary !== "string") errors.push("summary must be a string");
  const arrayFields = ["dataCollected", "sharing", "retention", "recommendations", "limitations"];
  for (const f of arrayFields) {
    if (!Array.isArray(data[f])) errors.push(`${f} must be an array`);
  }
  if (!Array.isArray(data.concerns)) errors.push("concerns must be an array");

  const checkFinding = (item, path) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) { errors.push(`${path} must be an object`); return; }
    if (typeof item.finding !== "string") errors.push(`${path}.finding must be a string`);
    if (typeof item.evidence !== "string") errors.push(`${path}.evidence must be a string`);
  };
  if (Array.isArray(data.dataCollected)) data.dataCollected.forEach((x, i) => checkFinding(x, `dataCollected[${i}]`));
  if (Array.isArray(data.sharing)) data.sharing.forEach((x, i) => checkFinding(x, `sharing[${i}]`));
  if (Array.isArray(data.retention)) data.retention.forEach((x, i) => checkFinding(x, `retention[${i}]`));
  if (Array.isArray(data.concerns)) {
    data.concerns.forEach((c, i) => {
      if (!c || typeof c !== "object" || Array.isArray(c)) { errors.push(`concerns[${i}] must be an object`); return; }
      if (typeof c.title !== "string") errors.push(`concerns[${i}].title must be a string`);
      if (typeof c.description !== "string") errors.push(`concerns[${i}].description must be a string`);
      if (!["low", "medium", "high"].includes(c.severity)) errors.push(`concerns[${i}].severity must be low|medium|high`);
      if (typeof c.evidence !== "string") errors.push(`concerns[${i}].evidence must be a string`);
    });
  }
  if (Array.isArray(data.recommendations) && data.recommendations.some((x) => typeof x !== "string")) errors.push("recommendations must be strings");
  if (Array.isArray(data.limitations) && data.limitations.some((x) => typeof x !== "string")) errors.push("limitations must be strings");

  return { ok: errors.length === 0, errors };
}

function validateEvidence(data, policyText) {
  const errors = [];
  const check = (item, path) => {
    if (item && typeof item.evidence === "string" && item.evidence !== "" && !policyText.includes(item.evidence)) {
      errors.push(`${path}.evidence is not an exact substring of the policy text`);
    }
  };
  (data.dataCollected || []).forEach((x, i) => check(x, `dataCollected[${i}]`));
  (data.sharing || []).forEach((x, i) => check(x, `sharing[${i}]`));
  (data.retention || []).forEach((x, i) => check(x, `retention[${i}]`));
  (data.concerns || []).forEach((c, i) => check(c, `concerns[${i}]`));
  return { ok: errors.length === 0, errors };
}

module.exports = { validateAnalysis, validateEvidence };
