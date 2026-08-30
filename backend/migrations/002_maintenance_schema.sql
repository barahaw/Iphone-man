CREATE TYPE maintenance_role AS ENUM ('admin', 'worker');

CREATE TABLE maintenance_users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role maintenance_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE maintenance_jobs (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES maintenance_users(id) ON DELETE RESTRICT,
  device_type TEXT NOT NULL,
  part_type TEXT NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
  customer_price NUMERIC(12,2) NOT NULL CHECK (customer_price >= 0),
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  net_amount NUMERIC(12,2) NOT NULL CHECK (net_amount >= 0),
  net_profit NUMERIC(12,2) NOT NULL CHECK (net_profit >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_jobs_worker_id ON maintenance_jobs(worker_id);
CREATE INDEX idx_maintenance_jobs_created_at ON maintenance_jobs(created_at);
