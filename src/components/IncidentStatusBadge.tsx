interface Props {
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

const statusConfig = {
  open: {
    label: '未対応',
    className: 'bg-primary/10 text-primary border border-primary/20',
    ariaLabel: 'ステータス：未対応',
  },
  in_progress: {
    label: '対応中',
    className: 'bg-warning/10 text-warning-dark border border-warning-dark/20',
    ariaLabel: 'ステータス：対応中',
  },
  resolved: {
    label: '解決済み',
    className: 'bg-success/10 text-success-dark border border-success-dark/20',
    ariaLabel: 'ステータス：解決済み',
  },
  closed: {
    label: 'クローズ',
    className: 'bg-gray-100 text-gray-700 border border-gray-300',
    ariaLabel: 'ステータス：クローズ',
  },
};

export default function IncidentStatusBadge({ status }: Props) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${config.className}`}
      aria-label={config.ariaLabel}
    >
      {config.label}
    </span>
  );
}
