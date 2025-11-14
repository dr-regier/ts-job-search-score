-- Migration: Add company_preferences column to profiles table
-- Date: 2025-01-14
-- Description: Adds optional company_preferences TEXT column for storing user's
--              ideal company preferences (industries, size, culture, values)

-- Add company_preferences column to profiles table
ALTER TABLE profiles
ADD COLUMN company_preferences TEXT;

-- Add comment to document the column's purpose
COMMENT ON COLUMN profiles.company_preferences IS 'User''s description of ideal company (industries, size, culture, values) - used for Company Fit scoring';
