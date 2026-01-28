import { useState } from 'react';
import { ExternalLink, ChevronDown, Code2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SnippetDisplay } from './SnippetDisplay';
import { formatRelativeTime } from '../../lib/date';
import { cn } from '../../lib/utils';
import type { CuratedContent } from '@social-content/shared';

interface CuratedContentCardProps {
  content: CuratedContent;
}

const sourceColors: Record<string, string> = {
  devto: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  hackernews: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  reddit: 'bg-red-500/20 text-red-400 border-red-500/30',
  github: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  medium: 'bg-green-500/20 text-green-400 border-green-500/30',
  youtube: 'bg-red-600/20 text-red-400 border-red-600/30',
};

const sourceLabels: Record<string, string> = {
  devto: 'DEV.to',
  hackernews: 'Hacker News',
  reddit: 'Reddit',
  github: 'GitHub',
  medium: 'Medium',
  youtube: 'YouTube',
};

const typeColors: Record<string, string> = {
  article: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  video: 'bg-red-500/20 text-red-400 border-red-500/30',
  tutorial: 'bg-green-500/20 text-green-400 border-green-500/30',
  documentation: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const typeLabels: Record<string, string> = {
  article: 'Artigo',
  video: 'Video',
  tutorial: 'Tutorial',
  documentation: 'Documentacao',
  other: 'Outro',
};

export function CuratedContentCard({ content }: CuratedContentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const sourceColor = sourceColors[content.source] || 'bg-muted text-muted-foreground';
  const sourceLabel = sourceLabels[content.source] || content.source;
  const typeColor = typeColors[content.type] || typeColors.other;
  const typeLabel = typeLabels[content.type] || content.type;

  return (
    <Card className="hover:border-primary/50 transition-colors flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={sourceColor}>
              {sourceLabel}
            </Badge>
            <Badge variant="outline" className={typeColor}>
              {typeLabel}
            </Badge>
          </div>
          {content.snippets.length > 0 && (
            <Badge variant="default" className="gap-1">
              <Code2 className="h-3 w-3" />
              {content.snippets.length} {content.snippets.length === 1 ? 'snippet' : 'snippets'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <h3 className="font-medium text-sm leading-snug line-clamp-3 mb-2">
          {content.title}
        </h3>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(content.curatedAt)}
        </span>

        {content.snippets.length > 0 && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-2 h-8"
              onClick={() => setExpanded(!expanded)}
            >
              <span className="text-xs">
                {expanded ? 'Ocultar' : 'Ver'} snippets
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  expanded && 'rotate-180'
                )}
              />
            </Button>

            {expanded && (
              <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {content.snippets.map((snippet) => (
                  <SnippetDisplay key={snippet.id} snippet={snippet} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3">
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver fonte
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
