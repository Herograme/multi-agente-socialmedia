import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Play, FileText, Star, Clock } from 'lucide-react';
import { api, HealthResponse } from '../lib/api';
import { useAppStore } from '../stores/app.store';

export function Dashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const setConnected = useAppStore((state) => state.setConnected);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await api.getHealth();
        setHealth(data);
        setConnected(true);
      } catch {
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [setConnected]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu content pipeline</p>
        </div>
        <Button className="gap-2">
          <Play className="h-4 w-4" />
          Nova Execução
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Hoje</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhum post gerado ainda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Sem dados suficientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Por execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Aprovação</CardTitle>
            <Badge variant="outline">-</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Posts aprovados</p>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>Conectividade com o backend</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Verificando conexão...</p>
          ) : health ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="success">Online</Badge>
                <span className="text-sm text-muted-foreground">
                  Ambiente: {health.environment}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Uptime: {Math.floor(health.uptime / 60)} minutos
              </p>
              <p className="text-xs text-muted-foreground">
                Última verificação: {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="destructive">Offline</Badge>
              <p className="text-sm text-muted-foreground">
                Não foi possível conectar ao backend. Verifique se o servidor está rodando.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Agentes</CardTitle>
          <CardDescription>Status da última execução</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <p>Nenhuma execução realizada ainda. Clique em &quot;Nova Execução&quot; para começar.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
