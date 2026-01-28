import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  CarouselGallery,
  PDFViewer,
  GenerateVisualButton,
  PostAssetsSkeleton,
} from '../components/assets';
import { usePost, useInvalidatePost } from '../hooks/usePost';
import { formatFileSize } from '../lib/fileSize';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Status badge configurations
const statusConfig = {
  pending: {
    label: 'Pendente',
    variant: 'outline' as const,
    icon: Clock,
    className: 'border-yellow-500/50 text-yellow-500',
  },
  approved: {
    label: 'Aprovado',
    variant: 'outline' as const,
    icon: CheckCircle,
    className: 'border-green-500/50 text-green-500',
  },
  rejected: {
    label: 'Rejeitado',
    variant: 'outline' as const,
    icon: XCircle,
    className: 'border-red-500/50 text-red-500',
  },
};

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invalidatePost = useInvalidatePost();

  const {
    post,
    carouselAssets,
    pdfAsset,
    isLoading,
    isError,
    error,
    refetch,
    updateStatus,
    isUpdating,
    hasAssets,
  } = usePost(id);

  // Handle visual generation complete
  const handleGenerationComplete = () => {
    if (id) {
      invalidatePost(id);
      refetch();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <PostAssetsSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/posts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Posts
        </Button>

        <Card className="border-destructive/50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Erro ao carregar post</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Post not found
  if (!post) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/posts')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Posts
        </Button>

        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Post nao encontrado</h3>
              <p className="text-muted-foreground">
                O post solicitado nao existe ou foi removido.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[post.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/posts" aria-label="Voltar para lista de posts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Post #{post.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground text-sm">
              Criado em {new Date(post.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <Badge variant={statusInfo.variant} className={statusInfo.className}>
          <StatusIcon className="h-3.5 w-3.5 mr-1" />
          {statusInfo.label}
        </Badge>
      </div>

      {/* Post Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conteudo do Post</CardTitle>
            <CardDescription>Textos gerados para as plataformas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {post.textInstagram && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-pink-500/10 text-pink-500 border-pink-500/30">
                    Instagram
                  </Badge>
                </h4>
                <div className="bg-muted rounded-md p-4">
                  <p className="text-sm whitespace-pre-wrap">{post.textInstagram}</p>
                </div>
              </div>
            )}

            {post.textLinkedin && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                    LinkedIn
                  </Badge>
                </h4>
                <div className="bg-muted rounded-md p-4">
                  <p className="text-sm whitespace-pre-wrap">{post.textLinkedin}</p>
                </div>
              </div>
            )}

            {!post.textInstagram && !post.textLinkedin && (
              <p className="text-muted-foreground text-center py-4">
                Nenhum texto gerado para este post
              </p>
            )}
          </CardContent>
        </Card>

        {/* QA Score */}
        {post.score && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avaliacao de Qualidade</CardTitle>
              <CardDescription>Score gerado pelo agente QA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Score Geral</span>
                  <span
                    className={`text-2xl font-bold ${
                      post.score.overallScore >= 80
                        ? 'text-green-500'
                        : post.score.overallScore >= 60
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {post.score.overallScore}/100
                  </span>
                </div>

                {/* Criteria Breakdown */}
                {post.score.criteriaBreakdown && post.score.criteriaBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Criterios</h4>
                    {post.score.criteriaBreakdown.map((criteria, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{criteria.name}</span>
                        <span>{criteria.score}/100</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Feedback */}
                {post.score.feedback && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Feedback</h4>
                    <p className="text-sm text-muted-foreground">
                      {post.score.feedback}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visual Assets */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Assets Visuais
        </h2>

        {hasAssets ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carousel Gallery */}
            {carouselAssets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Carrossel</CardTitle>
                  <CardDescription>
                    {carouselAssets.length} slide{carouselAssets.length !== 1 ? 's' : ''} gerado
                    {carouselAssets.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CarouselGallery
                    slides={carouselAssets}
                    postId={post.id}
                    apiBaseUrl={API_BASE}
                  />
                </CardContent>
              </Card>
            )}

            {/* PDF Viewer */}
            {pdfAsset && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documento PDF</CardTitle>
                  <CardDescription>
                    Tamanho: {formatFileSize(pdfAsset.sizeBytes)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PDFViewer
                    pdfUrl={`${API_BASE}/api/assets/${pdfAsset.id}`}
                    size={pdfAsset.sizeBytes}
                    filename={`post-${post.id}.pdf`}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <GenerateVisualButton
            postId={post.id}
            apiBaseUrl={API_BASE}
            onComplete={handleGenerationComplete}
          />
        )}
      </div>

      {/* Action Buttons */}
      {post.status === 'pending' && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Aprovar ou rejeitar este post para publicacao
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateStatus('rejected')}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => updateStatus('approved')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
