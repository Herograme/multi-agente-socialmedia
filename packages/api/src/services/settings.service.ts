/**
 * Settings Service
 * Story 5.6: Pagina de Configuracoes
 *
 * Service for managing application settings with SQLite persistence.
 */

import type Database from 'better-sqlite3';
import type {
  Settings,
  SettingsResponse,
  SourcesSettings,
  LLMSettings,
  ImageSettings,
  QualitySettings,
  OutputSettings,
} from '@social-content/shared';
import { DEFAULT_SETTINGS } from '@social-content/shared';

const SETTINGS_KEY = 'app_settings';

/**
 * Deep merge two objects
 */
function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      result[key] = deepMerge(
        target[key] as object,
        sourceValue as object
      ) as T[typeof key];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[typeof key];
    }
  }

  return result;
}

export class SettingsService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.ensureConfigTable();
  }

  /**
   * Ensure the config table exists
   */
  private ensureConfigTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  /**
   * Get current settings
   */
  async getSettings(): Promise<SettingsResponse> {
    const row = this.db
      .prepare('SELECT value, updated_at FROM config WHERE key = ?')
      .get(SETTINGS_KEY) as { value: string; updated_at: string } | undefined;

    if (!row) {
      return {
        settings: DEFAULT_SETTINGS,
        isDefault: true,
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      const stored = JSON.parse(row.value) as Partial<Settings>;
      const merged = this.mergeWithDefaults(stored);

      return {
        settings: merged,
        isDefault: false,
        updatedAt: row.updated_at,
      };
    } catch {
      // If parsing fails, return defaults
      return {
        settings: DEFAULT_SETTINGS,
        isDefault: true,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Update settings
   */
  async updateSettings(updates: Partial<Settings>): Promise<SettingsResponse> {
    const current = await this.getSettings();
    const merged = deepMerge(current.settings, updates);

    const now = new Date().toISOString();

    this.db
      .prepare(
        `
        INSERT INTO config (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
      `
      )
      .run(SETTINGS_KEY, JSON.stringify(merged), now);

    return {
      settings: merged,
      isDefault: false,
      updatedAt: now,
    };
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<SettingsResponse> {
    this.db.prepare('DELETE FROM config WHERE key = ?').run(SETTINGS_KEY);

    return {
      settings: DEFAULT_SETTINGS,
      isDefault: true,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get a specific settings section
   */
  async getSources(): Promise<SourcesSettings> {
    const response = await this.getSettings();
    return response.settings.sources;
  }

  async getLLM(): Promise<LLMSettings> {
    const response = await this.getSettings();
    return response.settings.llm;
  }

  async getImage(): Promise<ImageSettings> {
    const response = await this.getSettings();
    return response.settings.image;
  }

  async getQuality(): Promise<QualitySettings> {
    const response = await this.getSettings();
    return response.settings.quality;
  }

  async getOutput(): Promise<OutputSettings> {
    const response = await this.getSettings();
    return response.settings.output;
  }

  /**
   * Merge partial settings with defaults
   */
  private mergeWithDefaults(partial: Partial<Settings>): Settings {
    return deepMerge(DEFAULT_SETTINGS, partial);
  }
}

/**
 * Factory function
 */
export function createSettingsService(db: Database.Database): SettingsService {
  return new SettingsService(db);
}
