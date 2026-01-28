import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure as preferências do sistema</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fontes de Tendências</CardTitle>
            <CardDescription>Configure quais fontes serão pesquisadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Dev.to</span>
              <Badge variant="success">Ativo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Hacker News</span>
              <Badge variant="success">Ativo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Reddit r/programming</span>
              <Badge variant="success">Ativo</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Providers de LLM</CardTitle>
            <CardDescription>Configure os providers de IA para geração de texto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Groq (Llama 3)</span>
              <Badge variant="outline">Primário</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Google Gemini</span>
              <Badge variant="secondary">Fallback</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Providers de Imagem</CardTitle>
            <CardDescription>Configure os providers de geração de imagens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Ideogram</span>
              <Badge variant="outline">Primário</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Leonardo.ai</span>
              <Badge variant="secondary">Fallback</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Qualidade</CardTitle>
            <CardDescription>Defina o threshold mínimo de qualidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Threshold mínimo</span>
              <Badge>6.0 / 10</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
