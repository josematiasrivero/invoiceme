-- ============================================================
-- InvoiceMe Initial Schema Migration
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENTITIES TABLE
-- ============================================================
CREATE TABLE entities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('client', 'provider', 'both')),
  aba_routing      TEXT,
  account_number   TEXT,
  bank_name        TEXT,
  bank_address     TEXT,
  primary_color    TEXT NOT NULL DEFAULT '#1D4ED8'
                   CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  invoice_prefix   TEXT NOT NULL,
  invoice_counter  INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT entities_invoice_prefix_unique UNIQUE (invoice_prefix)
);

CREATE INDEX idx_entities_name ON entities (name);
CREATE INDEX idx_entities_type ON entities (type);

-- ============================================================
-- INVOICES TABLE
-- ============================================================
CREATE TABLE invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number      TEXT NOT NULL,
  origin_id           UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
  destination_id      UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  service_description TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number),
  CONSTRAINT invoices_different_entities CHECK (origin_id <> destination_id)
);

CREATE INDEX idx_invoices_origin_id      ON invoices (origin_id);
CREATE INDEX idx_invoices_destination_id ON invoices (destination_id);
CREATE INDEX idx_invoices_date           ON invoices (date DESC);

-- ============================================================
-- ATOMIC INVOICE NUMBER GENERATION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number(entity_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix  TEXT;
  v_counter INTEGER;
BEGIN
  SELECT invoice_prefix, invoice_counter + 1
  INTO v_prefix, v_counter
  FROM entities
  WHERE id = entity_id
  FOR UPDATE;

  UPDATE entities
  SET invoice_counter = v_counter
  WHERE id = entity_id;

  RETURN v_prefix || '-' || LPAD(v_counter::TEXT, 3, '0');
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_entities_all"
  ON entities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_invoices_all"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
