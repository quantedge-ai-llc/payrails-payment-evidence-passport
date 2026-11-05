# Provenance and product boundary

This submission candidate was authored in a separate temporary directory in response to the isolated-submission task. No files were copied from FAS, ESRW or the earlier 60-file export into this implementation. No product branch, history, deployment or license was changed.

Starting review evidence: the prior 60-file export and /tmp/payrails-export-provenance.json. That export originated from edgelock-payrails, branch feat/paypal-ai-hackathon, base commit a103b707d95b5147624eba35feb7e981fe52238c plus uncommitted work; it contained shared product code and was not cleared for publication.

Replacement design: a new submission-only schema (sandbox_order, passport); a newly authored PostgreSQL adapter guarded to a disposable loopback database; a Store/Provider service interface; a new fixed-sandbox Orders v2 transport; a customer-only React receipt and local proxy; new validators, deterministic explanations, lifecycle scripts and tests. No original migrations 001–003, escrow/outbox schemas, product health checks, signing dependencies or legacy proxy routes are retained. No production service or infrastructure is included.

The earlier implementation was inspected before this task. This is newly authored implementation, not a certified clean-room process or legal finding about copyright. Functional concepts, generic interfaces and PayPal's public protocol inform the design; exact product code is not imported. Owner attestation is still required.

Public protocol reference: https://developer.paypal.com/api/rest/integration/orders-api

Evidence import is limited to sanitized, newly generated PayPal read-back facts from an existing sandbox order. No original database, raw provider personal data, purchase capabilities, merchant key or original source is imported. Mocked provider responses occur only in tests and are labeled offline. The merchant example is explicitly synthetic.

ESRW investigation: 51 local Git repositories were found in a bounded directory scan; relevant README/QTO/risk/workbench documentation and all-branch commit messages were searched for ESRW and potential ESG/research/risk-workbench phrases. Connected QTO exact/alias searches found no ESRW or workbench record. The QTO product portfolio lists ESG Sentinel separately; no source established that it is ESRW. ESRW identity remains unresolved; its repository/path or authoritative product definition is needed. FAS is a separate product. No FAS/ESRW source was used as an implementation input for this directory.
