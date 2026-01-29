/**
 * PostsChart Component
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Bar chart showing posts generated over the last 7 days by platform.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PostsByDayData } from '@social-content/shared';

export interface PostsChartProps {
  /** Posts data grouped by day */
  data: PostsByDayData[];
}

/**
 * Custom tooltip component for the posts chart.
 */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  return (
    <div className="bg-popover border rounded-lg p-3 shadow-lg">
      <p className="font-medium">
        {format(parseISO(label), "EEEE, dd 'de' MMM", { locale: ptBR })}
      </p>
      <div className="mt-2 space-y-1">
        <p className="text-sm">
          <span className="inline-block w-3 h-3 rounded mr-2 bg-pink-500" />
          Instagram: {payload[0]?.value ?? 0}
        </p>
        <p className="text-sm">
          <span className="inline-block w-3 h-3 rounded mr-2 bg-blue-500" />
          LinkedIn: {payload[1]?.value ?? 0}
        </p>
      </div>
    </div>
  );
}

/**
 * Displays a stacked bar chart of posts generated per day.
 * Shows breakdown by Instagram and LinkedIn platforms.
 */
export function PostsChart({ data }: PostsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhum post gerado nos ultimos 7 dias
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) =>
            format(parseISO(value), 'EEE', { locale: ptBR })
          }
          className="text-muted-foreground text-xs"
        />
        <YAxis className="text-muted-foreground text-xs" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="instagram"
          name="Instagram"
          fill="#ec4899"
          radius={[4, 4, 0, 0]}
          stackId="posts"
        />
        <Bar
          dataKey="linkedin"
          name="LinkedIn"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          stackId="posts"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
