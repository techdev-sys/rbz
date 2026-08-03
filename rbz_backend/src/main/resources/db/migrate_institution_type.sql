-- Migration: populate institution_type from legacy license_type string.
-- Run ONCE against the production database before restarting the backend.
-- Safe to re-run — uses WHERE institution_type IS NULL to avoid double-updates.

UPDATE company_profile
SET institution_type = 'DTMFI'
WHERE institution_type IS NULL
  AND (
      LOWER(license_type) LIKE '%deposit%'
      OR LOWER(license_type) LIKE '%dtmfi%'
  );

UPDATE company_profile
SET institution_type = 'MFI'
WHERE institution_type IS NULL
  AND license_type IS NOT NULL;

-- Any remaining rows (no licenseType set) default to MFI.
UPDATE company_profile
SET institution_type = 'MFI'
WHERE institution_type IS NULL;

-- Verify: should return 0 rows after migration.
SELECT id, company_name, license_type, institution_type
FROM company_profile
WHERE institution_type IS NULL;
