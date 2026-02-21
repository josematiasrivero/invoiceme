-- Add quantity and unit_price to invoices.
-- amount remains stored explicitly (quantity * unit_price) for immutability.
-- Existing rows get quantity=1 and unit_price=amount so the maths still hold.

ALTER TABLE invoices
  ADD COLUMN quantity   NUMERIC(12, 4) NOT NULL DEFAULT 1    CHECK (quantity > 0),
  ADD COLUMN unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0    CHECK (unit_price >= 0);

-- Back-fill existing rows: unit_price = amount, quantity = 1
UPDATE invoices SET unit_price = amount, quantity = 1;
