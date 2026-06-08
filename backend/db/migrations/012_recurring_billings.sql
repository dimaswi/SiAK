-- TABLE: recurring_billings
CREATE TABLE IF NOT EXISTS recurring_billings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            billing_type NOT NULL,
    title           VARCHAR(255) NOT NULL, -- e.g. "SPP"
    description     TEXT,
    amount          BIGINT NOT NULL,
    
    target_type     VARCHAR(50) NOT NULL, -- 'all', 'class'
    class_id        UUID REFERENCES classes(id) ON DELETE CASCADE,
    
    due_date_day    INTEGER NOT NULL CHECK (due_date_day >= 1 AND due_date_day <= 31),
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: recurring_billing_logs
CREATE TABLE IF NOT EXISTS recurring_billing_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recurring_billing_id UUID NOT NULL REFERENCES recurring_billings(id) ON DELETE CASCADE,
    month               INTEGER NOT NULL,
    year                INTEGER NOT NULL,
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(recurring_billing_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_recurring_billings_active ON recurring_billings(is_active);
