-- Migration: 003_post_rejection_reason.sql
-- Story 5.5 - Fluxo de Aprovacao de Posts
-- Adds rejection_reason and updated_at fields to posts table

-- Add rejection_reason column for storing rejection feedback
ALTER TABLE posts ADD COLUMN rejection_reason TEXT;

-- Add updated_at column for tracking post updates
ALTER TABLE posts ADD COLUMN updated_at TEXT;

-- Create index for rejection_reason to optimize queries for rejected posts
CREATE INDEX IF NOT EXISTS idx_posts_rejection_reason ON posts(rejection_reason);
