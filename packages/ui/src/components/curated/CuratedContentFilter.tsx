import type { CuratedContentType } from '@social-content/shared';
import { cn } from '../../lib/utils';

type FilterValue = CuratedContentType | 'all';

const CONTENT_TYPES: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'article', label: 'Artigos' },
  { value: 'video', label: 'Videos' },
  { value: 'tutorial', label: 'Tutoriais' },
  { value: 'documentation', label: 'Documentacao' },
  { value: 'other', label: 'Outros' },
];

interface CuratedContentFilterProps {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

export function CuratedContentFilter({ value, onChange }: CuratedContentFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CONTENT_TYPES.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full border transition-colors',
            value === type.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-transparent text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
