export function formatCurrency(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount ?? 0)
}

export function formatDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-AR').format(new Date(date))
}
