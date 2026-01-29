-- Migration: 002_templates.sql
-- Story 5.7 - Editor de Templates de Carrossel
-- Creates the templates table for carousel template customization

-- Tabela de templates customizados
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  theme TEXT NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
CREATE INDEX IF NOT EXISTS idx_templates_is_default ON templates(is_default);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);

-- Insert default template
INSERT OR IGNORE INTO templates (id, name, description, theme, is_default) VALUES (
  'default',
  'Default Dark',
  'Tema escuro padrao inspirado no GitHub',
  '{
    "colors": {
      "bgPrimary": "#0d1117",
      "bgSecondary": "#161b22",
      "bgTertiary": "#21262d",
      "textPrimary": "#f0f6fc",
      "textSecondary": "#8b949e",
      "textMuted": "#6e7681",
      "accentPrimary": "#58a6ff",
      "accentSecondary": "#7ee787"
    },
    "fonts": {
      "fontSans": "Inter",
      "fontMono": "JetBrains Mono",
      "fontSizeBase": 1
    },
    "overlay": {
      "color": "rgba(0, 0, 0, 0.6)",
      "opacity": 0.6
    },
    "branding": {
      "handle": "@dev",
      "position": "footer-right"
    }
  }',
  1
);
