'use client';

interface FlowToggleProps {
  selected: 'A' | 'B';
  onChange: (flow: 'A' | 'B') => void;
}

export default function FlowToggle({ selected, onChange }: FlowToggleProps) {
  return (
    <div className="flex items-center justify-center space-x-3">
      <span className="text-[11px] text-gray-500">Flow:</span>

      <div className="flex rounded-md bg-gray-100 p-0.5">
        <button
          onClick={() => onChange('A')}
          className={`px-5 py-1.5 rounded text-[11px] font-medium transition-all ${
            selected === 'A'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Flow A
        </button>
        <button
          onClick={() => onChange('B')}
          className={`px-5 py-1.5 rounded text-[11px] font-medium transition-all ${
            selected === 'B'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Flow B
        </button>
      </div>

      <div className="text-[10px] text-gray-400">
        {selected === 'A' ? (
          <span>Strategic Decision</span>
        ) : (
          <span>Task Execution</span>
        )}
      </div>
    </div>
  );
}
