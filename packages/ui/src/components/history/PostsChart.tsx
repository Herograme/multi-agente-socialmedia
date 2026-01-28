import { useMemo } from 'react';

interface PostsChartProps {
  data: Array<{
    date: string;
    count: number;
  }>;
  groupBy: 'day' | 'week';
}

/**
 * Simple bar chart showing posts per period
 * Uses CSS for rendering without external charting library
 */
export function PostsChart({ data, groupBy }: PostsChartProps) {
  const chartData = useMemo(() => {
    if (groupBy === 'day') {
      return data;
    }

    // Group by week
    const weeklyData = new Map<string, number>();
    data.forEach((item) => {
      const date = new Date(item.date);
      // Get start of week (Monday)
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(date.setDate(diff));
      const isoString = weekStart.toISOString();
      const weekKey = isoString ? isoString.split('T')[0] : item.date;
      weeklyData.set(weekKey ?? '', (weeklyData.get(weekKey ?? '') || 0) + item.count);
    });

    return Array.from(weeklyData.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }, [data, groupBy]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="relative h-[300px] w-full">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-muted-foreground">
        <span>{maxCount}</span>
        <span>{Math.round(maxCount / 2)}</span>
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

        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-between gap-1 px-1">
          {chartData.map((d, i) => {
            const heightPercent = (d.count / maxCount) * 100;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end group"
              >
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute -top-8 bg-popover border rounded px-2 py-1 text-xs shadow-lg z-10">
                  <span className="font-medium">{d.count} posts</span>
                  <br />
                  <span className="text-muted-foreground">
                    {groupBy === 'week' ? 'Semana de ' : ''}
                    {formatDate(d.date)}
                  </span>
                </div>
                <div
                  className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 cursor-pointer"
                  style={{ height: `${heightPercent}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                  title={`${d.count} posts - ${formatDate(d.date)}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-xs text-muted-foreground overflow-hidden">
        {chartData.length > 0 && chartData.length <= 10 ? (
          chartData.map((d, i) => (
            <span key={i} className="flex-1 text-center truncate">
              {formatDateShort(d.date)}
            </span>
          ))
        ) : (
          <>
            <span>{formatDateShort(chartData[0]?.date ?? '')}</span>
            {chartData.length > 2 && (
              <span>{formatDateShort(chartData[Math.floor(chartData.length / 2)]?.date ?? '')}</span>
            )}
            {chartData.length > 1 && (
              <span>{formatDateShort(chartData[chartData.length - 1]?.date ?? '')}</span>
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
