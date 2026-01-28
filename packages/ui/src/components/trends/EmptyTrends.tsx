import { SearchX, Search } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyTrendsProps {
  onResearch: () => void;
}

export function EmptyTrends({ onResearch }: EmptyTrendsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <SearchX className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">Nenhuma tendencia encontrada</h3>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        Execute uma pesquisa para descobrir as ultimas tendencias tech de fontes
        como Dev.to, Hacker News e Reddit.
      </p>
      <Button onClick={onResearch} className="gap-2">
        <Search className="h-4 w-4" />
        Pesquisar Agora
      </Button>
    </div>
  );
}
