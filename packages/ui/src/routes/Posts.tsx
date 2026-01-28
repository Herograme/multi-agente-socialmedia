import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function Posts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Posts</h1>
        <p className="text-muted-foreground">Gerencie seus posts gerados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts Gerados</CardTitle>
          <CardDescription>Lista de posts para aprovação e download</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>Nenhum post gerado ainda</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
