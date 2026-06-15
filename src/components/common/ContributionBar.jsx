import React from 'react';

export default function ContributionBar({ feature, importance = 0, value = 0, maxImportance = 1 }) {
  const absImp = Math.abs(importance);
  const pct = Math.round((absImp / (maxImportance || 1)) * 100);
  const sign = importance >= 0 ? '' : '-';

  const barColor = importance >= 0 ? 'from-emerald-400 to-emerald-600' : 'from-rose-400 to-rose-600';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{feature}</div>
        <div className={`text-xs ${importance >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{sign}{Math.round(importance * 100) / 100}</div>
      </div>
      <div className="w-full h-3 bg-gray-200 dark:bg-dark-border rounded overflow-hidden">
        <div style={{ width: `${Math.min(pct,100)}%` }} className={`h-full rounded ${barColor}`} />
      </div>
      <div className="text-xs text-gray-500">value: {String(value)}</div>
    </div>
  );
}
