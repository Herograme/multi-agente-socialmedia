import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CuratedContentCard } from '../components/curated/CuratedContentCard';
import { CuratedContentSkeleton } from '../components/curated/CuratedContentSkeleton';
import { CuratedContentFilter } from '../components/curated/CuratedContentFilter';
import { EmptyCurated } from '../components/curated/EmptyCurated';
import { CuratedErrorState } from '../components/curated/CuratedErrorState';
import { SnippetDisplay } from '../components/curated/SnippetDisplay';
import type { CuratedContent, Snippet } from '@social-content/shared';

// Mock the date utility
vi.mock('../lib/date', () => ({
  formatRelativeTime: () => '2 horas atras',
  formatDateTime: () => '28/01/2025, 14:30',
}));

describe('Curated Components', () => {
  describe('CuratedContentCard', () => {
    const mockContent: CuratedContent = {
      id: 'curated-1',
      title: 'Understanding React Server Components',
      source: 'devto',
      type: 'article',
      url: 'https://dev.to/article/123',
      snippets: [
        {
          id: 'snippet-1',
          code: 'const Component = () => <div>Hello</div>;',
          language: 'javascript',
          description: 'Basic React component',
        },
      ],
      curatedAt: '2025-01-28T10:00:00Z',
    };

    it('should render content title', () => {
      render(<CuratedContentCard content={mockContent} />);
      expect(screen.getByText('Understanding React Server Components')).toBeInTheDocument();
    });

    it('should render source badge with correct label', () => {
      render(<CuratedContentCard content={mockContent} />);
      expect(screen.getByText('DEV.to')).toBeInTheDocument();
    });

    it('should render type badge', () => {
      render(<CuratedContentCard content={mockContent} />);
      expect(screen.getByText('Artigo')).toBeInTheDocument();
    });

    it('should render snippets count badge', () => {
      render(<CuratedContentCard content={mockContent} />);
      expect(screen.getByText('1 snippet')).toBeInTheDocument();
    });

    it('should render plural snippets count for multiple snippets', () => {
      const contentWithMultipleSnippets: CuratedContent = {
        ...mockContent,
        snippets: [
          { id: 'snippet-1', code: 'code1', language: 'js' },
          { id: 'snippet-2', code: 'code2', language: 'ts' },
        ],
      };
      render(<CuratedContentCard content={contentWithMultipleSnippets} />);
      expect(screen.getByText('2 snippets')).toBeInTheDocument();
    });

    it('should render relative time', () => {
      render(<CuratedContentCard content={mockContent} />);
      expect(screen.getByText('2 horas atras')).toBeInTheDocument();
    });

    it('should render external link button', () => {
      render(<CuratedContentCard content={mockContent} />);
      const link = screen.getByRole('link', { name: /ver fonte/i });
      expect(link).toHaveAttribute('href', mockContent.url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should toggle snippets visibility when button clicked', () => {
      render(<CuratedContentCard content={mockContent} />);

      // Initially snippets are hidden
      expect(screen.queryByText('Basic React component')).not.toBeInTheDocument();

      // Click to expand
      const toggleButton = screen.getByRole('button', { name: /ver snippets/i });
      fireEvent.click(toggleButton);

      // Now snippet description should be visible
      expect(screen.getByText('Basic React component')).toBeInTheDocument();
    });

    it('should not render snippets toggle for content without snippets', () => {
      const contentWithoutSnippets: CuratedContent = {
        ...mockContent,
        snippets: [],
      };
      render(<CuratedContentCard content={contentWithoutSnippets} />);
      expect(screen.queryByRole('button', { name: /ver snippets/i })).not.toBeInTheDocument();
    });

    it('should render different sources correctly', () => {
      const hnContent: CuratedContent = {
        ...mockContent,
        source: 'hackernews',
      };
      render(<CuratedContentCard content={hnContent} />);
      expect(screen.getByText('Hacker News')).toBeInTheDocument();
    });

    it('should render different types correctly', () => {
      const tutorialContent: CuratedContent = {
        ...mockContent,
        type: 'tutorial',
      };
      render(<CuratedContentCard content={tutorialContent} />);
      expect(screen.getByText('Tutorial')).toBeInTheDocument();
    });
  });

  describe('CuratedContentSkeleton', () => {
    it('should render skeleton elements', () => {
      const { container } = render(<CuratedContentSkeleton />);
      // Check for pulse animation class
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      // Check for muted background elements (skeleton placeholders)
      expect(container.querySelectorAll('.bg-muted').length).toBeGreaterThan(0);
    });
  });

  describe('CuratedContentFilter', () => {
    it('should render all filter options', () => {
      const onChange = vi.fn();
      render(<CuratedContentFilter value="all" onChange={onChange} />);

      expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Artigos' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Videos' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tutoriais' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Documentacao' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Outros' })).toBeInTheDocument();
    });

    it('should call onChange when filter button is clicked', () => {
      const onChange = vi.fn();
      render(<CuratedContentFilter value="all" onChange={onChange} />);

      const articleButton = screen.getByRole('button', { name: 'Artigos' });
      fireEvent.click(articleButton);

      expect(onChange).toHaveBeenCalledWith('article');
    });

    it('should highlight the selected filter', () => {
      const onChange = vi.fn();
      render(<CuratedContentFilter value="article" onChange={onChange} />);

      const articleButton = screen.getByRole('button', { name: 'Artigos' });
      expect(articleButton).toHaveClass('bg-primary');
    });
  });

  describe('EmptyCurated', () => {
    it('should render empty state message', () => {
      render(<EmptyCurated />);

      expect(screen.getByText('Nenhum conteudo curado')).toBeInTheDocument();
      expect(screen.getByText(/O agente Curador ainda nao processou/)).toBeInTheDocument();
    });
  });

  describe('CuratedErrorState', () => {
    it('should render error message', () => {
      const onRetry = vi.fn();
      render(<CuratedErrorState message="Network error" onRetry={onRetry} />);

      expect(screen.getByText('Erro ao carregar conteudo curado')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should call onRetry when button is clicked', () => {
      const onRetry = vi.fn();
      render(<CuratedErrorState message="Network error" onRetry={onRetry} />);

      const button = screen.getByRole('button', { name: /tentar novamente/i });
      fireEvent.click(button);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('SnippetDisplay', () => {
    const mockSnippet: Snippet = {
      id: 'snippet-1',
      code: 'console.log("Hello, World!");',
      language: 'javascript',
      description: 'A simple hello world example',
    };

    it('should render snippet code container', () => {
      const { container } = render(<SnippetDisplay snippet={mockSnippet} />);
      // Syntax highlighter renders code in a pre > code structure
      const codeElement = container.querySelector('code.language-javascript');
      expect(codeElement).toBeInTheDocument();
      // Check that the code content is present (text is split into multiple spans by syntax highlighter)
      expect(codeElement?.textContent).toContain('console');
      expect(codeElement?.textContent).toContain('log');
    });

    it('should render snippet description when provided', () => {
      render(<SnippetDisplay snippet={mockSnippet} />);
      expect(screen.getByText('A simple hello world example')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const snippetWithoutDesc: Snippet = {
        id: 'snippet-2',
        code: 'const x = 1;',
        language: 'js',
      };
      render(<SnippetDisplay snippet={snippetWithoutDesc} />);
      expect(screen.queryByText('A simple hello world example')).not.toBeInTheDocument();
    });
  });
});
