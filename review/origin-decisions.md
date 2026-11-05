# Origin decisions

The former 60-file export is rejected as a publication source. It included private-product schemas, shared runtime and proxy code, and utilities not necessary for this submission. It is retained only as external review evidence. No source file is imported from it.

New code was authored from functional requirements and public PayPal Orders v2 protocol. The assistant had read the prior implementation; this is not certified clean-room development. Independently authored implementations replace the entire old database adapter, runtime validation, migration mechanism, proxy, API routes and UI rather than renaming old helpers.

Keep: fixed sandbox transport; atomic one-order reservation; dedicated receipt/purchase schema; merchant authentication; per-purchase capability digest; explicit-reference correlation; deterministic state-specific explanation; customer-only local browser interface; separate human approval and explicit CLI capture.

Exclude: prior migrations 001–003; contracts; private keys/signers; blockchain routes and application model; old webhook/outbox workers and schemas; all old web proxy endpoints; original repository history; cloud resource definitions/workflows; FAS/ESRW services, datasets and product code. Webhooks are unnecessary for this minimal local Orders v2 read-back demonstration and are omitted rather than copied.

No copyright ownership is inferred from tests, secret scans or prior package license fields. Proposed first-party ownership and ISC clearance remain pending an authorized rights-holder decision. Third-party licenses are inventoried separately.
