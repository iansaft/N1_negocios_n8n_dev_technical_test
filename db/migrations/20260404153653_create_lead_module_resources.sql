-- migrate:up

-- ==============================================================================
-- LEADS MODULE RESOURCES
-- ==============================================================================

-- ==============================================================================
-- TYPES
-- ==============================================================================

CREATE TYPE lead_status AS ENUM (
    'LEAD_VALID',
    'LEAD_ERROR'
);

-- ==============================================================================
-- TABLES
-- ==============================================================================

CREATE TABLE leads (
    lead_id     UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Input data
    name        VARCHAR(255)    NOT NULL,
    email       VARCHAR(255)    NOT NULL,
    cpf         CHAR(11)        NOT NULL,
    cep         CHAR(8)         NOT NULL,

    -- Enriched data via ViaCEP
    street      VARCHAR(255),
    city        VARCHAR(255),
    state       CHAR(2),

    -- Processing status
    status      lead_status     NOT NULL,

    -- Audit
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Integrity constraints
    CONSTRAINT uq_leads_cpf     UNIQUE (cpf),
    CONSTRAINT uq_leads_email   UNIQUE (email),

    CONSTRAINT chk_leads_name_not_empty     CHECK (length(trim(name))  > 0),
    CONSTRAINT chk_leads_email_not_empty    CHECK (length(trim(email)) > 0),
    CONSTRAINT chk_leads_cpf_length         CHECK (length(cpf) = 11),
    CONSTRAINT chk_leads_cep_length         CHECK (length(cep) = 8),
    CONSTRAINT chk_leads_state_format       CHECK (state ~ '^[A-Z]{2}$')
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX idx_leads_status      ON leads (status);
CREATE INDEX idx_leads_created_at  ON leads (created_at DESC);

-- ==============================================================================
-- FUNCTIONS
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

CREATE TRIGGER trig_leads_update
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ==============================================================================
-- ANALYZE
-- ==============================================================================

ANALYZE leads;

-- migrate:down

-- ==============================================================================
-- LEADS MODULE ROLLBACK
-- ==============================================================================

DROP TRIGGER IF EXISTS trig_leads_update ON leads;

DROP FUNCTION IF EXISTS update_updated_at();

DROP TABLE IF EXISTS leads;

DROP TYPE IF EXISTS lead_status;