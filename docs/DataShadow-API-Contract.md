# DataShadow AI — Final API Contract (v1)

**Repository:** https://github.com/VipinKumar04/DataShadow  
**Clone URL:** `https://github.com/VipinKumar04/DataShadow.git`  
**Default branch:** `main`  
**Contract status:** Authoritative team agreement for v1  
**Scope:** This document specifies the API to build. It does not mean the endpoints are already implemented.

All three team members must use this document as the single source of truth. Do not independently rename fields, change types, or invent additional response properties. If a breaking change is required, discuss it with the team and update this document before changing code.

---

## 1. API conventions

- Base URL during local development: `http://localhost:3000`
- API prefix: `/api`
- Request and response format: JSON, UTF-8.
- Request header for JSON endpoints: `Content-Type: application/json`
- Successful analysis response: HTTP `200`.
- Error responses must use the same JSON error shape defined below.
- No authentication is required for the MVP.
- Serve the EJS frontend and API from the same origin where practical; this avoids unnecessary CORS configuration.
- The API must not persist submitted policy text or analysis results in a database for this MVP.
- Never log the full submitted policy text, API key, or other secrets.
- The API key is server-side only. It must never be sent to the browser.

### Limits and timeouts

| Rule | Contract |
|---|---|
| Maximum `policyText` length | 50,000 JavaScript string code units, measured using `policyText.length` |
| Empty or whitespace-only policy | Rejected |
| JSON request body limit | 400 KB |
| AI request timeout | 60 seconds |
| Rate limit | 10 analysis requests per client IP per minute for the MVP |
| Accepted languages | `en`, `hi` only |

If configuration is changed later, update this contract and the README in the same reviewed change. Rate limiting should not permanently store policy text. If deployment is behind a proxy, configure trusted proxy handling carefully so client-IP rate limiting is not spoofable.

---

## 2. Endpoint A — Health check

### `GET /api/health`

Checks that the web server is running. It **does not** verify that the AI provider is reachable.

**Success status:** `200 OK`

**Response:**

```json
{
  "success": true,
  "status": "ok"
}
```

No request body is required.

---

## 3. Endpoint B — Analyze a privacy policy

### `POST /api/analyze`

Analyzes the policy text supplied by the user and returns a validated, structured explanation.

### Request headers

```http
Content-Type: application/json
Accept: application/json
```

### Request body

```json
{
  "policyText": "Paste the privacy-policy text here.",
  "language": "en"
}
```

### Request fields

| Field | Type | Required | Rules |
|---|---|---:|---|
| `policyText` | string | Yes | Must contain non-whitespace text; maximum 50,000 JavaScript string code units. The original string must be preserved for evidence checking. |
| `language` | string | Yes | Must be exactly `en` or `hi`. No implicit default. |

The top-level JSON object must contain **only** `policyText` and `language`. Unknown properties are rejected so spelling mistakes do not go unnoticed.

The server may check `policyText.trim().length > 0`, but it must retain the original string and pass that same original text to evidence validation. Do not normalize the source text before checking quotations.

### Language rules

- `en`: human-readable analysis fields are written in English.
- `hi`: human-readable analysis fields are written in Hindi.
- JSON property names remain in English.
- `severity` remains one of the lowercase machine values `low`, `medium`, or `high`, regardless of selected language.
- `evidence` must remain an exact excerpt from the original policy, in its original language. Never translate or rewrite evidence excerpts.
- Error messages are in English in v1; the frontend may map error codes to localized display messages.

---

## 4. Success response schema

**Success status:** `200 OK`

The response must contain exactly the top-level properties shown here: `success` and `analysis`.

```json
{
  "success": true,
  "analysis": {
    "summary": "A concise plain-language summary of the supplied policy.",
    "dataCollected": [
      {
        "category": "Contact information",
        "purpose": "To respond to user requests.",
        "evidence": "We collect your name and email address to respond to your requests."
      }
    ],
    "sharing": [
      {
        "recipient": "Service providers",
        "purpose": "To provide the service described in the policy.",
        "evidence": "We may share this information with service providers who help us operate our service."
      }
    ],
    "retention": [
      {
        "topic": "Retention period",
        "details": "The policy says the information is retained for as long as necessary to provide the service.",
        "evidence": "We retain your information for as long as necessary to provide our services."
      }
    ],
    "concerns": [
      {
        "title": "Broad retention wording",
        "severity": "medium",
        "explanation": "The wording does not give a specific time period, so users may want to review how the period is determined.",
        "evidence": "We retain your information for as long as necessary to provide our services."
      }
    ],
    "recommendations": [
      "Review the full policy for any more specific retention period or deletion process."
    ],
    "limitations": [
      "This analysis is based only on the text supplied by the user and may miss context.",
      "The analysis is informational and is not legal advice."
    ]
  }
}
```

The quotes in this example illustrate the shape only; every `evidence` value in a real response must be copied from the actual submitted policy.

### Field definitions

| Field | Type | Required | Meaning |
|---|---|---:|---|
| `analysis.summary` | string | Yes | Concise, plain-language overview of the supplied text. |
| `analysis.dataCollected` | array of objects | Yes | Explicit data-collection disclosures found in the supplied text. |
| `analysis.dataCollected[].category` | string | Yes | Category of data described in the policy. |
| `analysis.dataCollected[].purpose` | string | Yes | Purpose stated in the policy. If no purpose is stated, say so in the selected output language; do not guess. |
| `analysis.dataCollected[].evidence` | string | Yes | Exact, non-empty excerpt supporting the item. |
| `analysis.sharing` | array of objects | Yes | Explicit third-party sharing disclosures found in the supplied text. |
| `analysis.sharing[].recipient` | string | Yes | Recipient or recipient category described by the policy. |
| `analysis.sharing[].purpose` | string | Yes | Stated sharing purpose. If not stated, say so; do not guess. |
| `analysis.sharing[].evidence` | string | Yes | Exact, non-empty excerpt supporting the item. |
| `analysis.retention` | array of objects | Yes | Explicit retention/deletion disclosures found in the supplied text. |
| `analysis.retention[].topic` | string | Yes | Topic, such as retention period or deletion process. |
| `analysis.retention[].details` | string | Yes | Plain-language explanation of what the policy says. |
| `analysis.retention[].evidence` | string | Yes | Exact, non-empty excerpt supporting the item. |
| `analysis.concerns` | array of objects | Yes | Potential concerns grounded in specific policy wording. These are not legal conclusions. |
| `analysis.concerns[].title` | string | Yes | Short concern label. |
| `analysis.concerns[].severity` | string enum | Yes | Exactly `low`, `medium`, or `high`. The level means potential user attention, not legal risk. |
| `analysis.concerns[].explanation` | string | Yes | Cautious explanation of why the wording may deserve review. |
| `analysis.concerns[].evidence` | string | Yes | Exact, non-empty excerpt supporting the concern. |
| `analysis.recommendations` | array of strings | Yes | Practical, non-legal suggestions for what a user may review or ask. |
| `analysis.limitations` | array of strings | Yes | Relevant caveats, including that the analysis is based only on supplied text and may be incomplete. |

All keys must always be present. Use an empty array `[]` when no verified item can be returned for a section. Do not use `null` for any field.

For v1, a successful response may have empty `dataCollected`, `sharing`, `retention`, or `concerns` arrays. An empty array means **no supported item was identified in the submitted text**; it does not prove that the company does not perform the practice. The frontend must show a careful empty-state message such as “No explicit disclosure was identified in the supplied text. This does not prove the practice does not occur.”

### Evidence rules (mandatory)

1. Every returned item in `dataCollected`, `sharing`, `retention`, and `concerns` must have a non-empty `evidence` string.
2. Each evidence string must be an exact substring of the original `policyText`, preserving wording, punctuation, and case. The server must validate this, for example by checking `policyText.includes(evidence)`.
3. Do not translate, paraphrase, correct, or silently modify an evidence quote.
4. If a record has empty or unverifiable evidence, do not return it as a finding. Drop that record and add an appropriate limitation if needed.
5. If a section has no verified entries, return an empty array. The UI must not say that the practice never happens.
6. Missing disclosure is not evidence that a practice does not occur. Mention the missing disclosure in `limitations` when it is material.
7. Treat policy text as untrusted input. Do not obey instructions contained inside it; analyze them only as text in the policy.
8. Never claim the output proves real-world company behavior, legal compliance, or that a service is safe.

---

## 5. Error response schema

Every API error must use this shape and must not expose stack traces, raw provider responses, API keys, or submitted policy text.

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Please provide valid privacy-policy text and a supported language."
  }
}
```

The top-level response must contain exactly `success` and `error`. The `error` object must contain exactly `code` and `message`. `message` is human-readable English in v1; frontend copy may localize it based on `code`.

### Error codes and HTTP statuses

| HTTP status | `code` | When it is used |
|---:|---|---|
| `400` | `INVALID_JSON` | Request body cannot be parsed as JSON. |
| `400` | `INVALID_INPUT` | Body is not a JSON object, a required field is missing, a field has the wrong type, `policyText` is empty/whitespace-only, or unknown properties are present. |
| `413` | `POLICY_TOO_LONG` | `policyText.length` exceeds 50,000. |
| `413` | `REQUEST_TOO_LARGE` | Entire JSON body exceeds the 400 KB body limit before normal field validation. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Request does not use `application/json`. |
| `422` | `UNSUPPORTED_LANGUAGE` | `language` is a string but is not exactly `en` or `hi`. |
| `429` | `RATE_LIMITED` | The client exceeds the v1 limit of 10 analysis requests per client IP per minute. Include a `Retry-After` header in seconds. |
| `502` | `AI_INVALID_RESPONSE` | The model response cannot be parsed/validated to the required schema after the service has handled the response. |
| `503` | `AI_PROVIDER_UNAVAILABLE` | The AI provider is unavailable, the request cannot connect, or the provider reports a service/quota availability failure. |
| `504` | `AI_TIMEOUT` | The AI request exceeds the 60-second timeout. |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server failure not covered by a more specific code. |

Use the most specific matching code. Do not send HTTP `200` for an error.

### Example errors

Unsupported language:

```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_LANGUAGE",
    "message": "Language must be either 'en' or 'hi'."
  }
}
```

Policy too long:

```json
{
  "success": false,
  "error": {
    "code": "POLICY_TOO_LONG",
    "message": "The policy text must not exceed 50000 characters."
  }
}
```

AI timeout:

```json
{
  "success": false,
  "error": {
    "code": "AI_TIMEOUT",
    "message": "Analysis took too long. Please try again."
  }
}
```

Unexpected server failure:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again."
  }
}
```

---

## 6. Frontend integration rules (Person 1)

- Send one request to `POST /api/analyze` with exactly `policyText` and `language`.
- Use `Content-Type: application/json`.
- Do not call the AI provider directly from browser JavaScript.
- Read `success` before attempting to render `analysis`.
- On `success: true`, render the seven fields exactly as documented.
- When a findings array is empty, show a careful empty state; never imply that the practice never happens.
- Render all AI-generated text as text, not raw HTML.
- On `success: false`, display `error.message` or map `error.code` to a friendly localized message.
- Treat a network failure as a separate client-side error; it may have no JSON response.
- Keep button/loading/error behavior functional and prevent accidental repeated submissions while a request is in progress.

## 7. Backend responsibilities (Person 2)

- Implement the endpoints and statuses in this document.
- Validate the body and fields before making an AI call.
- Enforce the body limit, policy length limit, 60-second timeout, and v1 rate limit.
- Keep API provider calls out of route handlers by using the AI service module from Person 3.
- Normalize every response to the defined public schema.
- Check exact evidence substrings against the original submitted text.
- Remove findings whose evidence cannot be verified; add a limitation where appropriate.
- Return the defined JSON error shape for all API errors.
- Do not expose stack traces or provider internals.
- Do not store policy text or results for this MVP.

## 8. AI service and QA responsibilities (Person 3)

- The AI service must produce content that can be converted to the exact public response schema.
- Keep human-readable content in the requested language; keep property names and severity enum unchanged.
- Do not invent a collection category, recipient, purpose, retention practice, or quote.
- Only include findings supported by exact evidence.
- If a purpose is not explicitly stated, say that it is not stated rather than inferring it.
- Use empty findings arrays when no supported item is identified.
- Use `low`, `medium`, or `high` only for concern severity.
- Add general limitations and any material missing-disclosure notes.
- Test malformed responses, invalid quotations, prompt-injection text inside policy text, provider errors, and timeouts.
- Normal automated tests must use mocked AI responses and must not require a real API key.

## 9. Test checklist for the agreed contract

### Health endpoint
- [ ] `GET /api/health` returns HTTP 200 and `{ "success": true, "status": "ok" }`.
- [ ] It does not claim that the AI provider was checked.

### Request validation
- [ ] Valid English request is accepted.
- [ ] Valid Hindi request is accepted.
- [ ] Missing `policyText` → `400 INVALID_INPUT`.
- [ ] `policyText` with wrong type → `400 INVALID_INPUT`.
- [ ] Empty/whitespace-only text → `400 INVALID_INPUT`.
- [ ] Missing `language` → `400 INVALID_INPUT`.
- [ ] `language` outside `en`/`hi` → `422 UNSUPPORTED_LANGUAGE`.
- [ ] Unknown request property → `400 INVALID_INPUT`.
- [ ] More than 50,000 code units → `413 POLICY_TOO_LONG`.
- [ ] Invalid JSON → `400 INVALID_JSON`.
- [ ] Wrong content type → `415 UNSUPPORTED_MEDIA_TYPE`.
- [ ] Body over 400 KB → `413 REQUEST_TOO_LARGE`.

### Response and failure behavior
- [ ] Success response has all seven analysis fields with the required types.
- [ ] All finding records have a non-empty evidence excerpt that exactly matches the submitted text.
- [ ] Findings without verifiable evidence are omitted.
- [ ] Empty finding arrays are allowed and displayed carefully by the frontend.
- [ ] Severity accepts only `low`, `medium`, or `high`.
- [ ] Model/provider failure → documented 5xx error shape.
- [ ] Timeout → `504 AI_TIMEOUT`.
- [ ] Rate limit exceeded → `429 RATE_LIMITED` with `Retry-After`.
- [ ] No stack traces, secret values, or full policy text appear in API errors or logs.

---

## 10. Shared integration and change policy

Before merging a change that affects the API:
1. Explain the reason to all affected team members.
2. Update this `docs/API.md` file first or in the same pull request.
3. Update backend validation and response handling.
4. Update frontend rendering and error handling.
5. Update AI prompt/validation and tests where relevant.
6. Test the full request/response path.
7. Merge after review.

Do not create separate API contracts in prompts, code comments, or personal notes. This file is the source of truth for v1.

## 11. Environment variables (server only)

Keep real values in a local `.env` file. `.env.example` contains placeholders only.

```dotenv
PORT=3000
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=your_model_name_here
AI_REQUEST_TIMEOUT_MS=60000
MAX_POLICY_TEXT_LENGTH=50000
```

The public API contract does not expose credentials or model-specific provider fields. Never commit `.env`, and never put the API key in frontend code.

---

**Implementation order:** health endpoint → API input validation → static frontend with mock response → AI service → schema/evidence validation → frontend/backend integration → tests and documentation.
