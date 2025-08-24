import { URGENCY_LABELS, IMPACT_LABELS } from '@/lib/constants';
import type { Urgency, Impact } from '@/lib/api/types';

interface Props {
  level: Urgency | Impact;
  type?: 'urgency' | 'impact';
}

const levelStyles = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
} as const;

export default function PriorityBadge({ level, type = 'urgency' }: Props) {
  const labels = type === 'urgency' ? URGENCY_LABELS : IMPACT_LABELS;
  const label = labels[level];
  const className = levelStyles[level];
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium border ${className}`}
      role="status"
      aria-label={`${type === 'urgency' ? '緊急度' : '影響度'}: ${label}`}
    >
      {label}
    </span>
  );
}
