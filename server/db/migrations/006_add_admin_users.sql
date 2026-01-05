-- Add is_admin column to users table for superuser access
-- Admins can view any game state for debugging/playtesting

-- UP
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create a dedicated superuser account for debugging/playtesting
-- Password: superuser123 (bcrypt hash with 10 rounds)
INSERT INTO users (username, password_hash, display_name, is_admin)
VALUES ('superuser', '$2b$10$YCL3iOTP6Flul.M3Fn15NO.bAbaCXNBLtUFi41nOgayVtFldSUws6', 'Superuser', TRUE)
ON CONFLICT (username) DO UPDATE SET is_admin = TRUE;

-- DOWN
-- DELETE FROM users WHERE username = 'superuser';
-- ALTER TABLE users DROP COLUMN is_admin;
