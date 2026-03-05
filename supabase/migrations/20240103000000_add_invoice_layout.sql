-- Add invoice_layout to entities for layout variant selection.
-- Layouts: classic, minimal, sidebar, compact

ALTER TABLE entities
  ADD COLUMN invoice_layout TEXT NOT NULL DEFAULT 'classic'
  CHECK (invoice_layout IN ('classic', 'minimal', 'sidebar', 'compact'));
