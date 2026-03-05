-- Add address and email to entities (used in Bill To section of invoices)

ALTER TABLE entities
  ADD COLUMN address TEXT,
  ADD COLUMN email   TEXT;
