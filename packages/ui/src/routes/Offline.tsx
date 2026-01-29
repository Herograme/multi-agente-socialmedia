import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

/**
 * Offline fallback page
 * Shown when the app is offline and the requested page is not cached.
 *
 * Story 5.8: Service Worker
 */
export function Offline() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Offline Icon */}
            <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-6">
              <WifiOff className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold mb-2">Voce esta offline</h1>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              Parece que voce perdeu a conexao com a internet.
              Verifique sua conexao e tente novamente.
            </p>

            {/* Retry Button */}
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>

            {/* Additional info */}
            <p className="text-xs text-muted-foreground mt-6">
              Algumas funcionalidades podem estar disponiveis offline,
              mas dados mais recentes requerem conexao.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
