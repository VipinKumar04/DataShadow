# AI Setup and Troubleshooting

## Requirements

- Node.js 20 or later
- Install backend dependencies from `backend/` with `npm install`

## Configuration

Copy `.env.example` to `backend/.env`, then set the values for:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AI_REQUEST_TIMEOUT_MS`
- `AI_MAX_OUTPUT_TOKENS`
- `MAX_POLICY_TEXT_LENGTH`

`GEMINI_MODEL` must name a model supported by the configured Gemini API account; verify the model's availability before deployment. The backend server loads `backend/.env` at startup. Keep the API key server-side; never commit `.env` or expose credentials in client code.

## Run the backend

```sh
cd backend
npm install
npm start
```

Health check: `GET http://localhost:3000/api/health`

## Analysis service contract

The shared `analyzePolicy({ policyText, language })` service resolves to the analysis object, not an HTTP response envelope. `language` must be `en` or `hi`; human-readable values use that language and JSON property names remain English.

The analysis object has exactly these top-level fields:

- `summary`: string
- `dataCollected`: `{ category, purpose, evidence }` objects
- `sharing`: `{ recipient, purpose, evidence }` objects
- `retention`: `{ topic, details, evidence }` objects
- `concerns`: `{ title, severity, explanation, evidence }` objects; severity is `low`, `medium`, or `high`
- `recommendations`: string array
- `limitations`: string array

Finding evidence must be a non-empty exact substring of the submitted policy. Findings with missing or unverifiable evidence are omitted. The analysis is limited to the supplied text; missing disclosure does not prove an activity never occurs. The model may make mistakes, and results are informational, not legal advice.

## Tests

From `backend/`, run `npm test -- --runInBand`. Unit tests mock model responses and do not require a live API key. Live API smoke tests, if added, must be opt-in and separate from the normal test suite.

## Troubleshooting

| Service error code | HTTP-controller mapping | Meaning and check |
| --- | --- | --- |
| `AI_PROVIDER_UNAVAILABLE` | Internal `MISSING_CONFIG` or `PROVIDER_ERROR`; both map to HTTP 503. | Configuration is missing or the provider is unavailable. Check `GEMINI_API_KEY`, `GEMINI_MODEL`, and provider reachability. |
| `AI_TIMEOUT` | Internal `TIMEOUT`; maps to HTTP 504. | The provider did not respond before the configured timeout. Check provider status or adjust `AI_REQUEST_TIMEOUT_MS`. |
| `AI_INVALID_RESPONSE` | Internal `INVALID_MODEL_OUTPUT`; maps to HTTP 502. | The model returned malformed JSON or output that does not match the analysis schema. Do not bypass schema or evidence validation. |
| `AI_UNEXPECTED_ERROR` | Internal `UNEXPECTED_ERROR`; falls through to the controller's generic HTTP 503 provider-unavailable response. | An unexpected internal service failure. Check server-side diagnostics without logging API keys or submitted policy text. |
