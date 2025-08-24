interface Props {
  type: '障害' | '不具合';
}

const typeConfig = {
  '障害': {
    className: 'bg-error/10 text-error-dark border border-error-dark/20',
    ariaLabel: 'タイプ：障害',
  },
  '不具合': {
    className: 'bg-orange-100 text-orange-800 border border-orange-300',
    ariaLabel: 'タイプ：不具合',
  },
};

export default function IncidentTypeBadge({ type }: Props) {
  const config = typeConfig[type];
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${config.className}`}
      aria-label={config.ariaLabel}
    >
      {type}
    </span>
  );
}
