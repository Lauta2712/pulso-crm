import Badge from '../ui/Badge'

const STATUS_CONFIG = {
  new: { label: 'Nuevo', variant: 'info' },
  contacted: { label: 'Contactado', variant: 'accent' },
  interviewing: { label: 'Entrevista', variant: 'warning' },
  hired: { label: 'Contratado', variant: 'success' },
  rejected: { label: 'Rechazado', variant: 'danger' },
}

export default function CandidateStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'muted' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export { STATUS_CONFIG }
