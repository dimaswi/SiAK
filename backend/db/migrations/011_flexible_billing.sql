-- TABLE: billings
-- Mewakili kewajiban bayar siswa (SPP, Uang Gedung, dll)
CREATE TYPE billing_type AS ENUM ('SPP', 'UANG_GEDUNG', 'SERAGAM', 'LAINNYA');
CREATE TYPE billing_status AS ENUM ('belum_bayar', 'sebagian', 'lunas', 'dibatalkan');

CREATE TABLE IF NOT EXISTS billings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type            billing_type NOT NULL,
    title           VARCHAR(255) NOT NULL, -- e.g. "SPP Juli 2025"
    description     TEXT,
    total_amount    BIGINT NOT NULL,
    paid_amount     BIGINT NOT NULL DEFAULT 0,
    due_date        DATE NOT NULL,
    status          billing_status NOT NULL DEFAULT 'belum_bayar',
    
    -- Opsional untuk metadata periodik
    month           INTEGER,
    year            INTEGER,
    
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE: payment_transactions
-- Mewakili transaksi cicilan/pembayaran yang dilakukan siswa
CREATE TYPE payment_status AS ENUM ('pending', 'terverifikasi', 'ditolak');

CREATE TABLE IF NOT EXISTS payment_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_id          UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,
    amount              BIGINT NOT NULL,
    payment_date        DATE NOT NULL,
    payment_method      VARCHAR(100), -- e.g. "Transfer Bank", "Tunai"
    bank_name           VARCHAR(100),
    account_holder      VARCHAR(255),
    payment_proof_url   TEXT,
    status              payment_status NOT NULL DEFAULT 'pending',
    
    notes               TEXT,
    verified_by         UUID REFERENCES users(id),
    verified_at         TIMESTAMPTZ,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update status trigger for billings when payment_transactions are verified
CREATE OR REPLACE FUNCTION update_billing_status_after_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'terverifikasi' AND (OLD.status IS NULL OR OLD.status != 'terverifikasi') THEN
        UPDATE billings 
        SET paid_amount = paid_amount + NEW.amount,
            status = CASE 
                WHEN paid_amount + NEW.amount >= total_amount THEN 'lunas'::billing_status
                ELSE 'sebagian'::billing_status
            END,
            updated_at = NOW()
        WHERE id = NEW.billing_id;
    END IF;
    
    IF OLD.status = 'terverifikasi' AND NEW.status != 'terverifikasi' THEN
        UPDATE billings 
        SET paid_amount = paid_amount - OLD.amount,
            status = CASE 
                WHEN paid_amount - OLD.amount <= 0 THEN 'belum_bayar'::billing_status
                ELSE 'sebagian'::billing_status
            END,
            updated_at = NOW()
        WHERE id = NEW.billing_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_billing_after_payment
AFTER UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_billing_status_after_payment();

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_billings_student ON billings(student_id);
CREATE INDEX IF NOT EXISTS idx_billings_status ON billings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_billing ON payment_transactions(billing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
