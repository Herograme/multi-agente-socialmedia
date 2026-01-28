-- Migration: 001_initial_schema.sql
-- Story 4.1 - Persistencia com SQLite
-- Creates the initial database schema for pipeline execution persistence

-- Tabela de execucoes do pipeline
CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  config TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at);

-- Tabela de posts gerados
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  text_ig TEXT,
  text_linkedin TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_execution_id ON posts(execution_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

-- Tabela de assets (imagens, carroseis, PDFs)
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'carousel', 'pdf')),
  path TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assets_post_id ON assets(post_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- Tabela de scores do QA
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL UNIQUE,
  overall_score REAL NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
  criteria_breakdown TEXT NOT NULL DEFAULT '{}',
  feedback TEXT,
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scores_post_id ON scores(post_id);
CREATE INDEX IF NOT EXISTS idx_scores_overall_score ON scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_scores_approved ON scores(approved);
