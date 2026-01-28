/**
 * Template Engine Tests
 * Story 3.3 - Templates HTML/CSS para Slides
 */

import { describe, it, expect } from 'vitest';
import {
  interpolate,
  escapeHtml,
  isValidTemplateType,
  getTemplateTypes,
  DEFAULT_TEMPLATE_VALUES,
} from '../services/template-engine';

describe('Template Engine', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B');
    });

    it('should escape both single and double quotes', () => {
      const input = "It's a \"test\"";
      const expected = "It&#39;s a &quot;test&quot;";
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle string with no special characters', () => {
      const input = 'Hello World';
      expect(escapeHtml(input)).toBe(input);
    });

    it('should handle multiple occurrences of same character', () => {
      expect(escapeHtml('a < b < c')).toBe('a &lt; b &lt; c');
    });
  });

  describe('interpolate', () => {
    describe('simple variable substitution', () => {
      it('should replace simple variables', () => {
        const template = '<h1>{{title}}</h1>';
        const result = interpolate(template, { title: 'Hello World' });
        expect(result).toBe('<h1>Hello World</h1>');
      });

      it('should use default values for missing variables', () => {
        const template = '<p>{{handle}}</p>';
        const result = interpolate(template, {});
        expect(result).toBe('<p>@dev</p>');
      });

      it('should escape HTML in variables', () => {
        const template = '<p>{{content}}</p>';
        const result = interpolate(template, { content: '<script>xss</script>' });
        expect(result).toBe('<p>&lt;script&gt;xss&lt;/script&gt;</p>');
      });

      it('should NOT escape highlightedCode variable', () => {
        const template = '<div>{{highlightedCode}}</div>';
        const result = interpolate(template, {
          highlightedCode: '<pre><code>test</code></pre>',
        });
        expect(result).toBe('<div><pre><code>test</code></pre></div>');
      });

      it('should NOT escape shikiStyles variable', () => {
        const template = '<style>{{shikiStyles}}</style>';
        const result = interpolate(template, {
          shikiStyles: '.shiki { color: red; }',
        });
        expect(result).toBe('<style>.shiki { color: red; }</style>');
      });

      it('should handle multiple variables', () => {
        const template = '<h1>{{title}}</h1><p>{{content}}</p><span>{{handle}}</span>';
        const result = interpolate(template, {
          title: 'Test Title',
          content: 'Test content here',
          handle: '@testuser',
        });
        expect(result).toBe(
          '<h1>Test Title</h1><p>Test content here</p><span>@testuser</span>'
        );
      });

      it('should replace missing non-default variables with empty string', () => {
        const template = '<p>{{nonexistent}}</p>';
        const result = interpolate(template, {});
        expect(result).toBe('<p></p>');
      });
    });

    describe('conditional blocks', () => {
      it('should show content when variable is truthy', () => {
        const template = '{{#code}}<pre>{{code}}</pre>{{/code}}';
        const result = interpolate(template, { code: 'const x = 1;' });
        expect(result).toBe('<pre>const x = 1;</pre>');
      });

      it('should hide content when variable is undefined', () => {
        const template = '{{#code}}<pre>{{code}}</pre>{{/code}}';
        const result = interpolate(template, {});
        expect(result).toBe('');
      });

      it('should hide content when variable is empty string', () => {
        const template = '{{#subtitle}}<p>{{subtitle}}</p>{{/subtitle}}';
        const result = interpolate(template, { subtitle: '' });
        expect(result).toBe('');
      });

      it('should hide content when variable is false', () => {
        const template = '{{#socialIcons}}<div>Icons</div>{{/socialIcons}}';
        const result = interpolate(template, { socialIcons: false });
        expect(result).toBe('');
      });

      it('should show content when boolean variable is true', () => {
        const template = '{{#socialIcons}}<div>Icons</div>{{/socialIcons}}';
        const result = interpolate(template, { socialIcons: true });
        expect(result).toBe('<div>Icons</div>');
      });

      it('should handle nested conditionals', () => {
        const template =
          '{{#code}}<div>{{#language}}<span>{{language}}</span>{{/language}}<pre>{{code}}</pre></div>{{/code}}';
        const result = interpolate(template, {
          code: 'let x = 1;',
          language: 'typescript',
        });
        expect(result).toBe('<div><span>typescript</span><pre>let x = 1;</pre></div>');
      });

      it('should handle conditional with missing inner variable', () => {
        const template =
          '{{#code}}<div>{{#language}}<span>{{language}}</span>{{/language}}<pre>{{code}}</pre></div>{{/code}}';
        const result = interpolate(template, {
          code: 'let x = 1;',
        });
        // language has a default value
        expect(result).toBe('<div><span>typescript</span><pre>let x = 1;</pre></div>');
      });
    });

    describe('default values', () => {
      it('should use default handle value', () => {
        const template = '{{handle}}';
        const result = interpolate(template, {});
        expect(result).toBe(DEFAULT_TEMPLATE_VALUES.handle);
      });

      it('should use default overlayOpacity value', () => {
        const template = '{{overlayOpacity}}';
        const result = interpolate(template, {});
        expect(result).toBe(DEFAULT_TEMPLATE_VALUES.overlayOpacity);
      });

      it('should use default overlayColor value', () => {
        const template = '{{overlayColor}}';
        const result = interpolate(template, {});
        expect(result).toBe(DEFAULT_TEMPLATE_VALUES.overlayColor);
      });

      it('should use default cta value', () => {
        const template = '{{cta}}';
        const result = interpolate(template, {});
        expect(result).toBe(DEFAULT_TEMPLATE_VALUES.cta);
      });

      it('should use default language value', () => {
        const template = '{{language}}';
        const result = interpolate(template, {});
        expect(result).toBe(DEFAULT_TEMPLATE_VALUES.language);
      });

      it('should override default value when provided', () => {
        const template = '{{handle}}';
        const result = interpolate(template, { handle: '@custom' });
        expect(result).toBe('@custom');
      });
    });

    describe('edge cases', () => {
      it('should handle template with no variables', () => {
        const template = '<p>Static content</p>';
        const result = interpolate(template, {});
        expect(result).toBe('<p>Static content</p>');
      });

      it('should handle empty template', () => {
        const result = interpolate('', {});
        expect(result).toBe('');
      });

      it('should handle malformed variable syntax gracefully', () => {
        const template = '{{incomplete';
        const result = interpolate(template, {});
        expect(result).toBe('{{incomplete');
      });

      it('should handle variable with special characters in value', () => {
        const template = '{{title}}';
        const result = interpolate(template, { title: 'Hello & Goodbye <3' });
        expect(result).toBe('Hello &amp; Goodbye &lt;3');
      });
    });
  });

  describe('isValidTemplateType', () => {
    it('should return true for valid template types', () => {
      expect(isValidTemplateType('cover')).toBe(true);
      expect(isValidTemplateType('content')).toBe(true);
      expect(isValidTemplateType('code')).toBe(true);
      expect(isValidTemplateType('cta')).toBe(true);
    });

    it('should return false for invalid template types', () => {
      expect(isValidTemplateType('invalid')).toBe(false);
      expect(isValidTemplateType('')).toBe(false);
      expect(isValidTemplateType('COVER')).toBe(false); // case sensitive
    });
  });

  describe('getTemplateTypes', () => {
    it('should return all available template types', () => {
      const types = getTemplateTypes();

      expect(types).toContain('cover');
      expect(types).toContain('content');
      expect(types).toContain('code');
      expect(types).toContain('cta');
      expect(types).toHaveLength(4);
    });

    it('should return a copy of the types array', () => {
      const types1 = getTemplateTypes();
      const types2 = getTemplateTypes();

      expect(types1).not.toBe(types2);
      expect(types1).toEqual(types2);
    });
  });
});
