-- Update password hashes for default users (using SHA256 with correct salt)
-- JWT_SECRET: dev-secret-key-change-this-in-production

UPDATE users SET password_hash = 'a6806c822a63d8ca9b963498d88c7ced1a7978f567805d7f3a78afc2b9c41f80'
WHERE email = 'admin@example.com';

UPDATE users SET password_hash = '76e177d19a981dec0c6397f931b51fe7858330ff46e8306b0c174221cf8aa30c'
WHERE email = 'manager@example.com';

UPDATE users SET password_hash = 'bbfda2b9adfd3a0b2a6302900e46e9909527712ff3e3b9f2f5244eb7c1b27c87'
WHERE email = 'employee@example.com';

-- Verify updates
SELECT email,
       CASE
         WHEN password_hash = 'a6806c822a63d8ca9b963498d88c7ced1a7978f567805d7f3a78afc2b9c41f80' THEN 'Admin password updated'
         WHEN password_hash = '76e177d19a981dec0c6397f931b51fe7858330ff46e8306b0c174221cf8aa30c' THEN 'Manager password updated'
         WHEN password_hash = 'bbfda2b9adfd3a0b2a6302900e46e9909527712ff3e3b9f2f5244eb7c1b27c87' THEN 'Employee password updated'
         ELSE 'Password not updated'
       END as status
FROM users
WHERE email IN ('admin@example.com', 'manager@example.com', 'employee@example.com');