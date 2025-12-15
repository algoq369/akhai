interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
        {icon && <span className="text-sm">{icon}</span>}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-xl font-semibold text-white font-mono">{value}</p>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
