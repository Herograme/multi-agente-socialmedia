/**
 * OutputPreview Component
 * Displays partial outputs from pipeline execution in tabbed interface
 */

import { Badge } from '../ui/badge';
import { Search, Lightbulb, FileText, Image } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import type { PipelineOutputs } from '@social-content/shared';

interface OutputPreviewProps {
  outputs: PipelineOutputs;
}

type TabType = 'trends' | 'topics' | 'posts' | 'images';

interface Tab {
  id: TabType;
  label: string;
  icon: typeof Search;
}

const tabs: Tab[] = [
  { id: 'trends', label: 'Trends', icon: Search },
  { id: 'topics', label: 'Topics', icon: Lightbulb },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'images', label: 'Images', icon: Image },
];

export function OutputPreview({ outputs }: OutputPreviewProps) {
  const hasTrends = outputs.trends && outputs.trends.length > 0;
  const hasTopics = outputs.topics && outputs.topics.length > 0;
  const hasPosts = outputs.posts && outputs.posts.length > 0;
  const hasImages = outputs.images && outputs.images.length > 0;

  const hasAnyOutput = hasTrends || hasTopics || hasPosts || hasImages;

  // Determine default tab
  const defaultTab: TabType = hasTrends
    ? 'trends'
    : hasTopics
      ? 'topics'
      : hasPosts
        ? 'posts'
        : 'trends';
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const isTabDisabled = (tab: TabType): boolean => {
    switch (tab) {
      case 'trends':
        return !hasTrends;
      case 'topics':
        return !hasTopics;
      case 'posts':
        return !hasPosts;
      case 'images':
        return !hasImages;
      default:
        return true;
    }
  };

  if (!hasAnyOutput) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Aguardando outputs...
      </div>
    );
  }

  return (
    <div>
      {/* Tab List */}
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const disabled = isTabDisabled(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              className={cn(
                'flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-4 h-[300px] overflow-auto">
        {activeTab === 'trends' && hasTrends && (
          <div className="space-y-2">
            {outputs.trends?.map((trend, index) => (
              <div key={trend.id || index} className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{trend.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {trend.source}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'topics' && hasTopics && (
          <div className="space-y-2">
            {outputs.topics?.map((topic, index) => (
              <div key={topic.id || index} className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{topic.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {topic.description}
                </p>
                <Badge variant="outline" className="text-xs mt-2">
                  Potencial: {topic.engagementPotential}/10
                </Badge>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'posts' && hasPosts && (
          <div className="space-y-2">
            {outputs.posts?.map((post, index) => (
              <div key={post.id || index} className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{post.topicId || `Post ${index + 1}`}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                  {post.textInstagram || post.textLinkedin || 'Sem texto'}
                </p>
                {post.score && (
                  <Badge
                    variant={post.score.overallScore >= 6 ? 'default' : 'destructive'}
                    className="text-xs mt-2"
                  >
                    Score: {post.score.overallScore.toFixed(1)}/10
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'images' && hasImages && (
          <div className="grid grid-cols-2 gap-2">
            {outputs.images?.map((imagePath, index) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={`/api/assets/${imagePath}`}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for missing images
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
