CREATE TABLE admin_password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_password_reset_tokens_admin_user_id ON admin_password_reset_tokens(admin_user_id);

CREATE TABLE maintenance_password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  maintenance_user_id BIGINT NOT NULL REFERENCES maintenance_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_maintenance_password_reset_tokens_maintenance_user_id ON maintenance_password_reset_tokens(maintenance_user_id);
