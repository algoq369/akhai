'use client';

interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  description?: string;
}

export default function RangeInput({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
  description,
}: RangeInputProps) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {value}{suffix}
        </span>
      </div>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {description}
        </p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${
            ((value - min) / (max - min)) * 100
          }%, rgb(229, 231, 235) ${((value - min) / (max - min)) * 100}%, rgb(229, 231, 235) 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}
