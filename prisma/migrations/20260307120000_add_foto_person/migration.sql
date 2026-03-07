-- Add foto column to personen table
ALTER TABLE "personen" ADD COLUMN IF NOT EXISTS "foto" TEXT;
