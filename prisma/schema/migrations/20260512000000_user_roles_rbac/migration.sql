-- Extend the UserRole enum with role-based access control values.
-- PostgreSQL requires ALTER TYPE ... ADD VALUE for each addition.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SOCIAL_MANAGER';
