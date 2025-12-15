interface ProviderCardProps {
  name: string;
  status: 'active' | 'inactive' | 'error';
  model: string;
  queriesCount?: number;
  totalCost?: number;
}

export default function ProviderCard({ name, status, model, queriesCount, totalCost }: ProviderCardProps) {
  const statusConfig = {
    active: {
      color: 'text-white',
      dot: 'bg-white',
      label: 'Active',
    },
    inactive: {
      color: 'text-gray-500',
      dot: 'bg-gray-500',
      label: 'Inactive',
    },
    error: {
      color: 'text-gray-600',
      dot: 'bg-gray-600',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">{name}</h3>
        <div className={`flex items-center gap-1.5 ${config.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
          <span className="text-xs">{config.label}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Model: <span className="font-mono text-gray-400">{model}</span>
      </p>

      {(queriesCount !== undefined || totalCost !== undefined) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          {queriesCount !== undefined && (
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider">Queries</p>
              <p className="text-sm font-semibold text-white font-mono">{queriesCount}</p>
            </div>
          )}
          {totalCost !== undefined && (
            <div className="text-right">
              <p className="text-xs text-gray-600 uppercase tracking-wider">Cost</p>
              <p className="text-sm font-semibold text-white font-mono">${totalCost.toFixed(3)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
