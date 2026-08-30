-- Up Migration
DROP TABLE IF EXISTS payments;
DROP TYPE IF EXISTS payment_status;

-- Down Migration
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  transaction_reference TEXT
);
