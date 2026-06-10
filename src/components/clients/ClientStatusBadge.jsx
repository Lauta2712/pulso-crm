import Badge from '../ui/Badge'

const STATUS_CONFIG = {
  prospect: { label: 'Prospecto', variant: 'info' },
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'muted' },
  churned: { label: 'Perdido', variant: 'danger' },
}

export default function ClientStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'muted' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export { STATUS_CONFIG }
