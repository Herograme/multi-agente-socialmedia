// Quality Gate Configuration Tests - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadQualityGateConfig,
  getQualityThreshold,
  setQualityThreshold,
  getQualityGateConfig,
  updateQualityGateConfig,
  resetQualityGateConfig,
  getDefaultQualityGateConfig,
} from '../config/quality-gate';

describe('Quality Gate Configuration', () => {
  beforeEach(() => {
    // Reset config before each test
    resetQualityGateConfig();
    // Clear environment variables
    delete process.env['QUALITY_THRESHOLD'];
    delete process.env['QUALITY_AUTO_REGENERATE'];
    delete process.env['QUALITY_MAX_REGENERATIONS'];
  });

  afterEach(() => {
    resetQualityGateConfig();
  });

  describe('getDefaultQualityGateConfig', () => {
    it('should return default configuration', () => {
      const defaults = getDefaultQualityGateConfig();

      expect(defaults.threshold).toBe(6.0);
      expect(defaults.autoRegenerate).toBe(true);
      expect(defaults.maxRegenerations).toBe(1);
    });
  });

  describe('loadQualityGateConfig', () => {
    it('should load default config when no env vars set', () => {
      const config = loadQualityGateConfig();

      expect(config.threshold).toBe(6.0);
      expect(config.autoRegenerate).toBe(true);
      expect(config.maxRegenerations).toBe(1);
    });

    it('should override threshold from environment variable', () => {
      process.env['QUALITY_THRESHOLD'] = '7.5';

      const config = loadQualityGateConfig();

      expect(config.threshold).toBe(7.5);
    });

    it('should override autoRegenerate from environment variable', () => {
      process.env['QUALITY_AUTO_REGENERATE'] = 'false';

      const config = loadQualityGateConfig();

      expect(config.autoRegenerate).toBe(false);
    });

    it('should override maxRegenerations from environment variable', () => {
      process.env['QUALITY_MAX_REGENERATIONS'] = '3';

      const config = loadQualityGateConfig();

      expect(config.maxRegenerations).toBe(3);
    });

    it('should round threshold to 0.1 precision', () => {
      process.env['QUALITY_THRESHOLD'] = '7.55';

      const config = loadQualityGateConfig();

      expect(config.threshold).toBe(7.6);
    });

    it('should throw error for threshold below 0', () => {
      process.env['QUALITY_THRESHOLD'] = '-1';

      expect(() => loadQualityGateConfig()).toThrow(
        'Invalid threshold: -1. Must be between 0 and 10.'
      );
    });

    it('should throw error for threshold above 10', () => {
      process.env['QUALITY_THRESHOLD'] = '11';

      expect(() => loadQualityGateConfig()).toThrow(
        'Invalid threshold: 11. Must be between 0 and 10.'
      );
    });

    it('should throw error for invalid maxRegenerations', () => {
      process.env['QUALITY_MAX_REGENERATIONS'] = '6';

      expect(() => loadQualityGateConfig()).toThrow(
        'Invalid maxRegenerations: 6. Must be between 0 and 5.'
      );
    });
  });

  describe('getQualityThreshold', () => {
    it('should return current threshold', () => {
      const threshold = getQualityThreshold();

      expect(threshold).toBe(6.0);
    });

    it('should return updated threshold after setQualityThreshold', () => {
      setQualityThreshold(8.0);

      expect(getQualityThreshold()).toBe(8.0);
    });
  });

  describe('setQualityThreshold', () => {
    it('should update threshold with valid value', () => {
      setQualityThreshold(7.5);

      expect(getQualityThreshold()).toBe(7.5);
    });

    it('should round threshold to 0.1 precision', () => {
      setQualityThreshold(7.55);

      expect(getQualityThreshold()).toBe(7.6);
    });

    it('should accept threshold of 0', () => {
      setQualityThreshold(0);

      expect(getQualityThreshold()).toBe(0);
    });

    it('should accept threshold of 10', () => {
      setQualityThreshold(10);

      expect(getQualityThreshold()).toBe(10);
    });

    it('should throw error for negative threshold', () => {
      expect(() => setQualityThreshold(-0.1)).toThrow(
        'Invalid threshold: -0.1. Must be between 0 and 10.'
      );
    });

    it('should throw error for threshold above 10', () => {
      expect(() => setQualityThreshold(10.1)).toThrow(
        'Invalid threshold: 10.1. Must be between 0 and 10.'
      );
    });

    it('should throw error for NaN', () => {
      expect(() => setQualityThreshold(NaN)).toThrow(
        'Invalid threshold: must be a number'
      );
    });
  });

  describe('getQualityGateConfig', () => {
    it('should return copy of current config', () => {
      const config1 = getQualityGateConfig();
      const config2 = getQualityGateConfig();

      // Should be equal but not the same object
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it('should reflect changes after update', () => {
      setQualityThreshold(8.5);

      const config = getQualityGateConfig();

      expect(config.threshold).toBe(8.5);
    });
  });

  describe('updateQualityGateConfig', () => {
    it('should update threshold only', () => {
      const newConfig = updateQualityGateConfig({ threshold: 7.0 });

      expect(newConfig.threshold).toBe(7.0);
      expect(newConfig.autoRegenerate).toBe(true);
      expect(newConfig.maxRegenerations).toBe(1);
    });

    it('should update autoRegenerate only', () => {
      const newConfig = updateQualityGateConfig({ autoRegenerate: false });

      expect(newConfig.threshold).toBe(6.0);
      expect(newConfig.autoRegenerate).toBe(false);
      expect(newConfig.maxRegenerations).toBe(1);
    });

    it('should update multiple fields', () => {
      const newConfig = updateQualityGateConfig({
        threshold: 8.0,
        autoRegenerate: false,
        maxRegenerations: 2,
      });

      expect(newConfig.threshold).toBe(8.0);
      expect(newConfig.autoRegenerate).toBe(false);
      expect(newConfig.maxRegenerations).toBe(2);
    });

    it('should round threshold to 0.1 precision', () => {
      const newConfig = updateQualityGateConfig({ threshold: 7.55 });

      expect(newConfig.threshold).toBe(7.6);
    });

    it('should validate threshold range', () => {
      expect(() => updateQualityGateConfig({ threshold: 11 })).toThrow(
        'Invalid threshold: 11. Must be between 0 and 10.'
      );
    });

    it('should validate maxRegenerations range', () => {
      expect(() => updateQualityGateConfig({ maxRegenerations: 6 })).toThrow(
        'Invalid maxRegenerations: 6. Must be between 0 and 5.'
      );
    });

    it('should return copy of config, not reference', () => {
      const newConfig = updateQualityGateConfig({ threshold: 7.0 });
      newConfig.threshold = 9.0;

      expect(getQualityThreshold()).toBe(7.0);
    });
  });

  describe('resetQualityGateConfig', () => {
    it('should reset to default values', () => {
      setQualityThreshold(9.0);
      updateQualityGateConfig({ autoRegenerate: false, maxRegenerations: 3 });

      resetQualityGateConfig();

      const config = getQualityGateConfig();
      expect(config.threshold).toBe(6.0);
      expect(config.autoRegenerate).toBe(true);
      expect(config.maxRegenerations).toBe(1);
    });
  });
});
