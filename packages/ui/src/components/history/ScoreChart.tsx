import { useMemo } from 'react';

interface ScoreChartProps {
  data: Array<{
    date: string;
    averageScore: number;
    count: number;
  }>;
}

/**
 * Simple line chart showing score over time
 * Uses CSS and SVG for rendering without external charting library
 */
export function ScoreChart({ data }: ScoreChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    const minScore = 0;
    const maxScore = 10;
    const range = maxScore - minScore;

    return data.map((d, i) => ({
      ...d,
      normalizedScore: ((d.averageScore - minScore) / range) * 100,
      x: (i / (data.length - 1 || 1)) * 100,
    }));
  }, [data]);

  // Generate SVG path for line
  const linePath = useMemo(() => {
    if (chartData.length === 0) return '';

    const points = chartData.map((d) => {
      const x = d.x;
      const y = 100 - d.normalizedScore;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }, [chartData]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="relative h-[300px] w-full">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-muted-foreground">
        <span>10</span>
        <span>5</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="absolute left-10 right-0 top-0 bottom-6">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-muted h-0" />
          ))}
        </div>

        {/* SVG Line Chart */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {/* Dots */}
          {chartData.map((d, i) => (
            <circle
              key={i}
              cx={d.x}
              cy={100 - d.normalizedScore}
              r="4"
              fill="hsl(var(--primary))"
              vectorEffect="non-scaling-stroke"
              className="cursor-pointer hover:fill-primary/80"
            >
              <title>
                {formatDate(d.date)}: {d.averageScore.toFixed(1)}/10 ({d.count} execucoes)
              </title>
            </circle>
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-xs text-muted-foreground">
        {data.length > 0 && (
          <>
            <span>{formatDateShort(data[0]?.date ?? '')}</span>
            {data.length > 2 && (
              <span>{formatDateShort(data[Math.floor(data.length / 2)]?.date ?? '')}</span>
            )}
            {data.length > 1 && (
              <span>{formatDateShort(data[data.length - 1]?.date ?? '')}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}
