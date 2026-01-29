/**
 * ScoreDistributionChart Component
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Bar chart showing distribution of QA scores.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ScoreDistributionData } from '@social-content/shared';

export interface ScoreDistributionChartProps {
  /** Score distribution data */
  data: ScoreDistributionData[];
}

/**
 * Color mapping for each score range.
 */
const COLORS: Record<string, string> = {
  '0-2': '#ef4444',  // red-500
  '2-4': '#f97316',  // orange-500
  '4-6': '#eab308',  // yellow-500
  '6-8': '#22c55e',  // green-500
  '8-10': '#15803d', // green-700
};

/**
 * Custom tooltip for score distribution chart.
 */
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ScoreDistributionData }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-popover border rounded-lg p-3 shadow-lg">
      <p className="font-medium">Score {data.range}</p>
      <p className="text-sm text-muted-foreground">
        {data.count} posts ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

/**
 * Displays a bar chart showing the distribution of QA scores.
 * Each bar is colored according to the score range (red to green).
 */
export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  // Check if there's any data
  const hasData = data.length > 0 && data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhum dado de score disponivel
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="range"
          className="text-muted-foreground text-xs"
        />
        <YAxis className="text-muted-foreground text-xs" />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.range] || '#6b7280'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
