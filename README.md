# Sandbox Payment Evidence Passport — isolated submission candidate

PUBLICATION ON HOLD. This directory is a new, independently authored submission candidate. It is not a checkout deployment or a production service. No earlier product runtime, schema, signing code, infrastructure or proxy is imported.

## What works
PayPal sandbox USD 1.00 Orders v2 creation, human payer approval, explicitly authorized local capture, provider read-back, purchase evidence persistence and scoped customer receipt. Matching requires an explicit order/invoice reference plus exact amount and USD currency. Descriptor-only input returns NOT VERIFIED. Merchant identities, website, support, product, invoice and descriptor are merchant disclosures, not independent verification. The example identifies these as synthetic. Payment facts are read separately from PayPal sandbox.

Baseline explanations are deterministic, not AI-generated. An optional, independently added Gemini endpoint can order fixed grounded sentences; it does not import the earlier product AI implementation. One live `gemini-3.1-flash-lite` request returned HTTP 200 with schema-valid AI-assisted composition using a redacted synthetic sandbox fixture; see `evidence/gemini-live-check.json`. Live verification applies only to that request, not every receipt or future request. Meaningful AI functionality remains an unresolved hackathon eligibility gate, not a claim this candidate currently satisfies. AI cannot control funds.

## Local prerequisites
Node >=22.12, pnpm 10.27.0, Docker with official postgres:14 image, own PayPal sandbox REST client and separate sandbox personal buyer. No live credentials or funds. No paid infrastructure or hosted database. Ports 4101, 5178 and 55441 must be free. Run on a trusted single-user development machine.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
python3 scripts/validate_postgres.py
```

In Bash, enter sandbox REST values without echoing or putting values in command arguments/history:

```bash
read -r -s -p 'Sandbox client ID: ' PAYPAL_CLIENT_ID; printf '\n'
read -r -s -p 'Sandbox client secret: ' PAYPAL_CLIENT_SECRET; printf '\n'
export PAYPAL_CLIENT_ID PAYPAL_CLIENT_SECRET
node scripts/local.mjs start
```

The helper creates a password-protected disposable database named passport_demo at loopback only, applies only sql/001_passport.sql, and starts the loopback API. It creates one USD 1.00 sandbox order and a private purchase receipt. Protected external state is saved at /tmp/passport-isolated-private.json, mode 0600. If that file already exists, STOP and reconcile rather than overwrite or create another payment. Never share, print, commit or record that file.

In another terminal with the same sandbox credentials securely provided:

```sh
pnpm dev
```

Open http://127.0.0.1:5178. Enter the purchase ID and capability from the protected state into the local form; no capability is placed in a URL, fragment, cookie or persistent browser storage. The merchant key stays server-side. Do not record credential fields. A reload requires entering the capability again.

Open the protected approval URL yourself and sign in with a sandbox personal buyer. Approval is not capture. After payer approval, explicitly authorize this USD 1.00 sandbox capture:

```sh
AUTHORIZE_USD1_SANDBOX_CAPTURE=true node scripts/local.mjs capture
node scripts/local.mjs check
```

The helper uses a stable provider request ID, verifies provider approval before capture, reads back a matching COMPLETED capture, and persists the receipt payment snapshot. Retry of an already completed payment is read-only. For timeout/uncertain failure, reconcile GET state before retry; provider idempotency retention is finite. The customer API exposes no capture endpoint. Customer GET/recognition never creates or captures payment.

Re-open/refresh the receipt. Try its exact order reference, then leave reference empty with the same descriptor: MATCHED versus NOT VERIFIED. CREATED, APPROVED and PENDING must not be presented as completed payment. Provider outage fails closed rather than showing stale proof of completion.

## Previously captured evidence
The supplied redacted read-back evidence verifies an existing completed sandbox order using this new implementation. It is not evidence of a fresh create/approve/capture run by this code. Automated mocked-provider tests cover the new capture sequence, authorization, stable request ID and uncertain outcomes. A fresh end-to-end approval/capture run remains NOT VERIFIED until separately recorded.

## Cleanup
Ctrl-C the start process to stop its API and remove its disposable database container; stop Vite separately. Remove the protected state once finished. Do not run migrations against shared or hosted databases; the database interface rejects non-loopback targets and any database other than passport_demo.

## Source and license boundary
See PROVENANCE.md and OWNERSHIP.md. ISC is a proposed first-party license only; LICENSE.proposed is not an executed blanket license. Publication requires the rights holder's ownership/scope approval. Third-party dependencies retain their own licenses and notices. No Git history from any product is included.

## Limits
Local sandbox demonstration only; no production tenancy, capability expiry/revocation, webhook listener, refunds or live-payment support. No hosted live checkout or completed submission is claimed. The separately recorded live AI check uses synthetic evidence and does not establish a fresh payment flow. Public source publication, video and Devpost remain pending.

## Read-only evidence dashboard and optional Gemini

The Community-only AG Grid dashboard displays the existing redacted recorded sandbox evidence in `evidence/provider-readback.json`. It is not a live account feed or a newly invented purchase. Filter using the search box or column menus, sort column headers, and use **Open private Passport form**. The anchor contains no purchase ID or capability; enter your private access values in the existing form. Merchant/product disclosures remain synthetic. No Enterprise packages, AG Studio, paid grid license or infrastructure is required.

The optional `POST /v1/passports/:id/explanation` requires the same `x-passport-access` authorization as the receipt. Its strict body accepts only `{}` or `{ "observation": { "amount": "1.00", "currency": "USD", "descriptor": "...", "order_reference": "..." } }`; reference fields are optional. The server refreshes authorized PayPal evidence first. It sends only redacted sandbox stage, deterministic correlation and disclosure flags to the fixed Gemini `gemini-3.1-flash-lite` endpoint. No order ID, name, invoice, capability or merchant text is sent. Gemini selects the ordering of four fixed grounded sentences; this is explicitly **AI-assisted composition, not free-form AI analysis**. MATCHED/NOT VERIFIED remains deterministic; descriptor alone never identifies a purchase. No model tools or payment actions exist.

Supply an optional personal Gemini API key **only to the server process**, never as a `VITE_*` value, browser field, URL or committed file. In Bash, before starting the local helper:

```bash
read -r -s -p 'Optional Gemini API key: ' GEMINI_API_KEY; printf '\n'
export GEMINI_API_KEY
node scripts/local.mjs start
```

Existing-state reconciliation rules above still apply; do not start a second demo or create a payment just to test explanations. Restart only your intended API when ready to supply a key. Without a key, or on provider error, timeout, invalid output or request-budget exhaustion, the response/UI explicitly labels **Non-AI deterministic fallback**, with live AI NOT VERIFIED. Requests are bounded to 8 seconds, 16 KiB response, 256 output tokens, two in flight and ten provider requests/minute per process. These are local demo limits, not distributed production quotas. Gemini invocation may incur the API key owner's provider charges and sends the described redacted facts to Google; the application does not persist the key. `pnpm api` loads an optional ignored root `.env` for development; never commit it. A successful live invocation is verified only when actually performed; mocked tests do not establish live AI execution.

Verification: `pnpm install --frozen-lockfile && pnpm test && pnpm build`; `python3 scripts/validate_postgres.py` uses a disposable network-isolated PostgreSQL container. Run `node scripts/license_inventory.mjs` to refresh third-party notices. Open `http://127.0.0.1:5178`, inspect/filter/sort the dashboard, open the private Passport form, and test an explicit reference versus descriptor only. Then click **Explain current reference check**. With no key expect the labeled fallback; with an approved key expect Gemini-assisted ordering only if the provider succeeds. This change does not establish a fresh isolated-app capture, hosted checkout or completed hackathon eligibility.

Recorded live AI verification: `evidence/gemini-live-check.json` documents the single successful HTTP 200 request, genuine AI label, grounded schema checks, unchanged NOT VERIFIED status and absence of observed quota/billing errors. It is an operator-recorded assertion from this session, not a raw response or evidence of a PayPal refresh. No additional live call is made by the test suite.
