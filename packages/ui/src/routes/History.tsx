import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function History() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico</h1>
        <p className="text-muted-foreground">Histórico de execuções do pipeline</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execuções Anteriores</CardTitle>
          <CardDescription>Visualize métricas e resultados passados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>Nenhuma execução registrada</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
