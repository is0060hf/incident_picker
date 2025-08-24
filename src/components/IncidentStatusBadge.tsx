interface Props {
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

const statusConfig = {
  open: {
    label: '未対応',
    className: 'bg-blue-100 text-blue-700',
  },
  in_progress: {
    label: '対応中',
    className: 'bg-yellow-100 text-yellow-700',
  },
  resolved: {
    label: '解決済み',
    className: 'bg-green-100 text-green-700',
  },
  closed: {
    label: 'クローズ',
    className: 'bg-gray-100 text-gray-700',
  },
};

export default function IncidentStatusBadge({ status }: Props) {
  const config = statusConfig[status];
  
  return (
    <span className={`px-2 py-1 rounded text-sm ${config.className}`}>
      {config.label}
    </span>
  );
}
