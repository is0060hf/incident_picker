interface Props {
  level: 'high' | 'medium' | 'low';
  type?: 'urgency' | 'impact';
}

const levelConfig = {
  high: {
    label: '高',
    className: 'bg-error/10 text-error-dark border border-error-dark/20',
    ariaLabel: '優先度：高',
  },
  medium: {
    label: '中',
    className: 'bg-warning/10 text-warning-dark border border-warning-dark/20',
    ariaLabel: '優先度：中',
  },
  low: {
    label: '低',
    className: 'bg-gray-100 text-gray-700 border border-gray-300',
    ariaLabel: '優先度：低',
  },
};

export default function PriorityBadge({ level, type = 'urgency' }: Props) {
  const config = levelConfig[level];
  const typeLabel = type === 'urgency' ? '緊急度' : '影響度';
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${config.className}`}
      aria-label={`${typeLabel}：${config.label}`}
    >
      {config.label}
    </span>
  );
}
