import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function Execution() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Execução</h1>
        <p className="text-muted-foreground">Acompanhe a execução do pipeline em tempo real</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline de Agentes</CardTitle>
          <CardDescription>Visualização do progresso da execução</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>Nenhuma execução em andamento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
