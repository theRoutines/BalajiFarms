import { ORDER_STATUS, STATUS_COLORS } from '../../utils/constants.js'

export function StatusBadge({ status }) {
  const label = ORDER_STATUS[status] || status
  const style = STATUS_COLORS[status] || {
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
    dot: 'bg-stone-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}

export default StatusBadge

