import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { CategoryStock } from '../types';

interface CategoryStockChartProps {
  data: CategoryStock[];
}

const PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#F97316', // Orange
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  totalInventoryUnits: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, totalInventoryUnits }) => {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload as CategoryStock;
    const percentage = totalInventoryUnits > 0
      ? ((item.totalStock / totalInventoryUnits) * 100).toFixed(1)
      : '0';

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 text-xs min-w-[190px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-700">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {item.category}
          </span>
          <span className="text-gray-500 dark:text-gray-400 font-mono">
            {percentage}%
          </span>
        </div>
        <div className="space-y-1.5 text-gray-600 dark:text-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Total Stock:</span>
            <span className="font-bold text-gray-900 dark:text-white font-mono text-sm">
              {item.totalStock.toLocaleString()} units
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">Products in Cat:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200 font-mono">
              {item.productCount}
            </span>
          </div>
          {item.lowStockCount > 0 && (
            <div className="flex justify-between items-center pt-1 text-amber-600 dark:text-amber-400">
              <span>Low Stock Alerts:</span>
              <span className="font-semibold font-mono">{item.lowStockCount} items</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const CategoryStockChart: React.FC<CategoryStockChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');
  const [sortBy, setSortBy] = useState<'stock' | 'name'>('stock');

  const totalInventoryUnits = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.totalStock, 0);
  }, [data]);

  const topCategory = useMemo(() => {
    if (data.length === 0) return null;
    return [...data].sort((a, b) => b.totalStock - a.totalStock)[0];
  }, [data]);

  const processedData = useMemo(() => {
    const list = [...data];
    if (sortBy === 'stock') {
      list.sort((a, b) => b.totalStock - a.totalStock);
    } else {
      list.sort((a, b) => a.category.localeCompare(b.category));
    }
    return list;
  }, [data, sortBy]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center text-gray-500 dark:text-gray-400">
        No product category stock data available yet.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Stock Levels by Category
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({data.length} categories)
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time inventory distribution and volume per product line
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Selector */}
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700/60 p-1">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Bar View
            </button>
            <button
              type="button"
              onClick={() => setChartType('donut')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                chartType === 'donut'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Share View
            </button>
          </div>

          {/* Sort Selector */}
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700/60 p-1">
            <button
              type="button"
              onClick={() => setSortBy('stock')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                sortBy === 'stock'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Sort by stock volume"
            >
              Volume ↓
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                sortBy === 'name'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Sort alphabetically"
            >
              A–Z
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Units in Stock</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white font-mono mt-0.5">
            {totalInventoryUnits.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">Top Stock Category</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white truncate mt-0.5" title={topCategory?.category}>
            {topCategory?.category || '—'}
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Units / Category</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white font-mono mt-0.5">
            {data.length > 0 ? Math.round(totalInventoryUnits / data.length).toLocaleString() : 0}
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
          <div className="text-xs text-gray-500 dark:text-gray-400">Categories Monitored</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white font-mono mt-0.5">
            {data.length}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={processedData}
              margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#9CA3AF"
                opacity={0.2}
              />
              <XAxis
                dataKey="category"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip totalInventoryUnits={totalInventoryUnits} />}
                cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
              />
              <Bar
                dataKey="totalStock"
                name="Stock Level"
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
              >
                {processedData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PALETTE[index % PALETTE.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Tooltip content={<CustomTooltip totalInventoryUnits={totalInventoryUnits} />} />
              <Pie
                data={processedData}
                dataKey="totalStock"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
              >
                {processedData.map((_, index) => (
                  <Cell
                    key={`pie-cell-${index}`}
                    fill={PALETTE[index % PALETTE.length]}
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{
                  paddingTop: 16,
                  fontSize: '12px',
                }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Chips */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-3">
          {processedData.map((item, idx) => (
            <div key={item.category} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
              />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {item.category}:
              </span>
              <span className="font-mono text-gray-900 dark:text-white">
                {item.totalStock}
              </span>
            </div>
          ))}
        </div>
        <div className="text-gray-400 dark:text-gray-500 italic">
          Hover over bars for detailed category breakdown
        </div>
      </div>
    </div>
  );
};

export default CategoryStockChart;
