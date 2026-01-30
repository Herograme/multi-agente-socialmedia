import { FileText, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

export function EmptyCurated() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Nenhum conteudo curado</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        O agente Curador ainda nao processou nenhum conteudo.
        <br />
        Execute o Pesquisador primeiro para gerar tendencias.
      </p>
      <Button onClick={() => navigate('/pipeline')}>
        <Play className="mr-2 h-4 w-4" />
        Executar Pipeline
      </Button>
    </div>
  );
}
