interface Props {
  type: '障害' | '不具合';
}

const typeConfig = {
  '障害': {
    className: 'bg-red-100 text-red-700',
  },
  '不具合': {
    className: 'bg-orange-100 text-orange-700',
  },
};

export default function IncidentTypeBadge({ type }: Props) {
  const config = typeConfig[type];
  
  return (
    <span className={`px-2 py-1 rounded text-sm ${config.className}`}>
      {type}
    </span>
  );
}
