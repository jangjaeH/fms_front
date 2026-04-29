interface StatusBadgeProps {
  tone: string;
  label: string;
}

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone.toLowerCase()}`}>{label}</span>;
}
