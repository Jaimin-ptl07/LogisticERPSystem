#!/usr/bin/env python3
"""
Generate SHA256 password hashes with correct salt
"""
import hashlib

# JWT_SECRET from docker container environment
JWT_SECRET = "dev-secret-key-change-this-in-production"

def get_password_hash(password: str) -> str:
    """Generate SHA256 password hash"""
    # Add salt to the password
    salted_password = password + JWT_SECRET
    # Hash with SHA256
    return hashlib.sha256(salted_password.encode('utf-8')).hexdigest()

# Generate password hashes
admin_pass = get_password_hash("admin123")
manager_pass = get_password_hash("manager123")
employee_pass = get_password_hash("employee123")

print(f"JWT_SECRET: {JWT_SECRET}")
print(f"\nPassword hash for admin123: {admin_pass}")
print(f"Password hash for manager123: {manager_pass}")
print(f"Password hash for employee123: {employee_pass}")

# Generate SQL
sql = f"""
-- Update password hashes for default users (using SHA256 with correct salt)
UPDATE users SET password_hash = '{admin_pass}' WHERE email = 'admin@example.com';

UPDATE users SET password_hash = '{manager_pass}' WHERE email = 'manager@example.com';

UPDATE users SET password_hash = '{employee_pass}' WHERE email = 'employee@example.com';
"""

print("\nSQL to update passwords:")
print(sql)