import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Snippet } from '@social-content/shared';

interface SnippetDisplayProps {
  snippet: Snippet;
}

// Map common language aliases to Prism language names
const languageMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  yml: 'yaml',
  md: 'markdown',
};

export function SnippetDisplay({ snippet }: SnippetDisplayProps) {
  const language = languageMap[snippet.language] || snippet.language;

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {snippet.description && (
        <div className="bg-muted/50 px-3 py-2 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {snippet.description}
          </p>
        </div>
      )}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
          padding: '1rem',
        }}
        showLineNumbers={snippet.code.split('\n').length > 3}
        wrapLines
      >
        {snippet.code}
      </SyntaxHighlighter>
    </div>
  );
}
