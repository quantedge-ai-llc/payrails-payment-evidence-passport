-- Independently authored demo schema. No prior product migrations are needed.
CREATE TABLE IF NOT EXISTS sandbox_order (
  reservation uuid PRIMARY KEY,
  request_digest text NOT NULL,
  amount text NOT NULL CHECK (amount = '1.00'),
  provider_id text UNIQUE,
  reserved_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS passport (
  id uuid PRIMARY KEY,
  provider_id text NOT NULL UNIQUE REFERENCES sandbox_order(provider_id),
  capability_digest text NOT NULL,
  merchant_disclosure jsonb NOT NULL,
  disclosure_digest text NOT NULL,
  verified_payment jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
