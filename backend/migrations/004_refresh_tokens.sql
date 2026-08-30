CREATE TABLE admin_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_refresh_tokens_admin_user_id ON admin_refresh_tokens(admin_user_id);

CREATE TABLE maintenance_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  maintenance_user_id BIGINT NOT NULL REFERENCES maintenance_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_maintenance_refresh_tokens_maintenance_user_id ON maintenance_refresh_tokens(maintenance_user_id);
