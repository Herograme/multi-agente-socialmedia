import { FileText } from 'lucide-react';

export function EmptyCurated() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Nenhum conteudo curado</h3>
      <p className="text-muted-foreground text-center max-w-md">
        O agente Curador ainda nao processou nenhum conteudo.
        <br />
        Execute o Pesquisador primeiro para gerar tendencias.
      </p>
    </div>
  );
}
