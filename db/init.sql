-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users (auth identity)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT UNIQUE NOT NULL,
  full_name       TEXT,
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Refresh token storage
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_expires ON refresh_tokens(expires_at);

-- Provider credentials (Google, Slack) - encrypted at rest
CREATE TABLE IF NOT EXISTS provider_credentials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL CHECK (provider IN ('google','slack')),
  access_token_enc  BYTEA,
  refresh_token_enc BYTEA,
  token_expiry      TIMESTAMPTZ,
  scopes            TEXT[],
  webhook_url_enc   BYTEA,
  metadata_json     JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- Demo profile for mock mode defaults (per user)
CREATE TABLE IF NOT EXISTS demo_profiles (
  user_id     UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mock_enabled BOOLEAN NOT NULL DEFAULT false,
  scenario     TEXT NOT NULL DEFAULT 'medium' CHECK (scenario IN ('low','medium','high')),
  overrides    JSONB,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assistant recommendation audit
CREATE TABLE IF NOT EXISTS recommendation_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  features_json   JSONB NOT NULL,
  stress_level    INT NOT NULL CHECK (stress_level BETWEEN 0 AND 10),
  action_taken    TEXT NOT NULL,
  action_details  JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reco_user_created ON recommendation_logs(user_id, created_at DESC);

-- Actions audit
CREATE TABLE IF NOT EXISTS action_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_name        TEXT NOT NULL,
  request_payload    JSONB NOT NULL,
  integration_result JSONB,
  status             TEXT NOT NULL CHECK (status IN ('success','failure')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_action_user_created ON action_logs(user_id, created_at DESC);

-- Optional caches
CREATE TABLE IF NOT EXISTS calendar_event_cache (
  id            TEXT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL DEFAULT 'google',
  summary       TEXT,
  description   TEXT,
  start_at      TIMESTAMPTZ NOT NULL,
  end_at        TIMESTAMPTZ NOT NULL,
  raw_json      JSONB,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cal_user_time ON calendar_event_cache(user_id, start_at, end_at);

CREATE TABLE IF NOT EXISTS heart_rate_samples (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  captured_at   TIMESTAMPTZ NOT NULL,
  bpm           NUMERIC(5,2) NOT NULL,
  source        TEXT NOT NULL DEFAULT 'google_fit',
  raw_json      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hr_user_time ON heart_rate_samples(user_id, captured_at DESC);
