-- ---------------------------------------------------------------------------
-- 20260727000007_add_employee_email.sql
-- Adds an optional email column to the employees table.
-- ---------------------------------------------------------------------------

ALTER TABLE employees
  ADD COLUMN email text;

-- Create a unique index on the lowercased email, but only for active employees
CREATE UNIQUE INDEX uq_employees_active_email
  ON employees (lower(email))
  WHERE deleted_at IS NULL AND email IS NOT NULL;
