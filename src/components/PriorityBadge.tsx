interface Props {
  level: 'high' | 'medium' | 'low';
  type?: 'urgency' | 'impact';
}

const levelConfig = {
  high: {
    label: '高',
    className: 'bg-red-100 text-red-700',
  },
  medium: {
    label: '中',
    className: 'bg-yellow-100 text-yellow-700',
  },
  low: {
    label: '低',
    className: 'bg-gray-100 text-gray-700',
  },
};

export default function PriorityBadge({ level }: Props) {
  const config = levelConfig[level];
  
  return (
    <span className={`px-2 py-1 rounded text-sm ${config.className}`}>
      {config.label}
    </span>
  );
}
