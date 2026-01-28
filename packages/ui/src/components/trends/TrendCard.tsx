import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatRelativeTime } from '../../lib/date';
import type { Trend } from '@social-content/shared';

interface TrendCardProps {
  trend: Trend;
}

const sourceColors: Record<string, string> = {
  devto: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  hackernews: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  reddit: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const sourceLabels: Record<string, string> = {
  devto: 'DEV.to',
  hackernews: 'Hacker News',
  reddit: 'Reddit',
};

export function TrendCard({ trend }: TrendCardProps) {
  const sourceColor = sourceColors[trend.source] || '';
  const sourceLabel = sourceLabels[trend.source] || trend.source;

  return (
    <Card className="hover:border-primary/50 transition-colors flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={sourceColor}>
            {sourceLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(trend.discoveredAt)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <h3 className="font-medium text-sm leading-snug line-clamp-3">
          {trend.title}
        </h3>
        {trend.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {trend.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-3">
        <a
          href={trend.url}
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
