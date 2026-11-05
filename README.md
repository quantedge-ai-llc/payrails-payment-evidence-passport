# Sandbox Payment Evidence Passport — isolated submission candidate

PUBLICATION ON HOLD. This directory is a new, independently authored submission candidate. It is not a checkout deployment or a production service. No earlier product runtime, schema, signing code, infrastructure or proxy is imported.

## What works
PayPal sandbox USD 1.00 Orders v2 creation, human payer approval, explicitly authorized local capture, provider read-back, purchase evidence persistence and scoped customer receipt. Matching requires an explicit order/invoice reference plus exact amount and USD currency. Descriptor-only input returns NOT VERIFIED. Merchant identities, website, support, product, invoice and descriptor are merchant disclosures, not independent verification. The example identifies these as synthetic. Payment facts are read separately from PayPal sandbox.

Explanations are deterministic, not AI-generated. Live AI execution is NOT VERIFIED. This isolation deliberately does not import the earlier optional AI implementation. Meaningful AI functionality is an unresolved hackathon eligibility gate, not a claim this candidate currently satisfies. AI cannot control funds.

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
Local sandbox demonstration only; no production tenancy, capability expiry/revocation, webhook listener, refunds or live-payment support. No hosted live checkout, live AI result or completed submission is claimed. Public source publication, video and Devpost remain pending.
