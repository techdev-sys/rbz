-- One-time cleanup: remove duplicate company_profile rows with the same email.
-- Keep the row with the highest id (latest record) for each email.
-- Run ONCE against production before restarting the backend.
-- Verify with: SELECT email_address, count(*) FROM company_profile GROUP BY email_address HAVING count(*) > 1;

DELETE FROM company_profile
WHERE id NOT IN (
    SELECT MAX(id)
    FROM company_profile
    GROUP BY email_address
);

-- After cleanup succeeds, optionally add the uniqueness constraint manually:
-- ALTER TABLE company_profile ADD CONSTRAINT uq_company_profile_email UNIQUE (email_address);
