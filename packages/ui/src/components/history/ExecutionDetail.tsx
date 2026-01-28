import { FileText, Image, CheckCircle, XCircle, Clock, Star, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { HistorySkeleton } from './HistorySkeleton';
import { useExecution } from '../../hooks/useExecutions';
import { Platform, PostStatus } from '@social-content/shared';
import type { PostSummary } from '@social-content/shared';

interface ExecutionDetailProps {
  executionId: string;
}

/**
 * Detailed view of a single execution including its posts
 */
export function ExecutionDetail({ executionId }: ExecutionDetailProps) {
  const { data: execution, isLoading, error } = useExecution(executionId);

  if (isLoading) {
    return <HistorySkeleton variant="list" count={2} />;
  }

  if (error) {
    return (
      <div className="text-center py-6 text-destructive">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Erro ao carregar detalhes: {error.message}</p>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>Execucao nao encontrada</p>
      </div>
    );
  }

  const posts = execution.posts || [];

  return (
    <div className="space-y-4">
      {/* Config summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <ConfigCard
          label="Posts Solicitados"
          value={execution.config.numPosts.toString()}
        />
        <ConfigCard
          label="Posts Gerados"
          value={execution.postsGenerated.toString()}
        />
        <ConfigCard
          label="Posts Aprovados"
          value={execution.postsApproved.toString()}
        />
        <ConfigCard
          label="Score Medio"
          value={execution.averageScore?.toFixed(1) || 'N/A'}
        />
      </div>

      {/* Platform badges */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Plataformas:</span>
        {execution.config.platforms.map((platform) => (
          <Badge key={platform} variant="outline">
            {platform === Platform.INSTAGRAM ? 'Instagram' : 'LinkedIn'}
          </Badge>
        ))}
      </div>

      {/* Posts list */}
      {posts.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Posts ({posts.length})
          </h4>
          <div className="grid gap-2 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhum post gerado nesta execucao</p>
        </div>
      )}
    </div>
  );
}

interface ConfigCardProps {
  label: string;
  value: string;
}

function ConfigCard({ label, value }: ConfigCardProps) {
  return (
    <Card className="bg-background/50">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

interface PostCardProps {
  post: PostSummary;
}

function PostCard({ post }: PostCardProps) {
  return (
    <Card className="bg-background/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={post.topic}>
              {post.topic}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {post.platform === Platform.INSTAGRAM ? 'IG' : 'LI'}
              </Badge>
              <PostStatusBadge status={post.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.hasVisual && (
              <span title="Tem visual">
                <Image className="h-4 w-4 text-muted-foreground" />
              </span>
            )}
            {post.score !== null && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3 w-3" />
                <span>{post.score.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PostStatusBadgeProps {
  status: PostStatus;
}

function PostStatusBadge({ status }: PostStatusBadgeProps) {
  switch (status) {
    case PostStatus.APPROVED:
      return (
        <Badge variant="success" className="text-xs gap-1">
          <CheckCircle className="h-2.5 w-2.5" />
          Aprovado
        </Badge>
      );
    case PostStatus.REJECTED:
      return (
        <Badge variant="destructive" className="text-xs gap-1">
          <XCircle className="h-2.5 w-2.5" />
          Rejeitado
        </Badge>
      );
    case PostStatus.PENDING:
    default:
      return (
        <Badge variant="secondary" className="text-xs gap-1">
          <Clock className="h-2.5 w-2.5" />
          Pendente
        </Badge>
      );
  }
}
