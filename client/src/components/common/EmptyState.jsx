export function EmptyState({
  title = 'No items found',
  description = 'There is nothing to display here at the moment.',
  actionText,
  onAction,
  icon,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-stone-50/50 p-12 text-center">
      {icon ? (
        <div className="mb-4 text-stone-400">{icon}</div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream text-forest shadow-sm">
          <svg
            className="h-7 w-7 text-forest/70"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-charcoal">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-charcoal/70">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-full bg-forest px-5 py-2 text-sm font-medium text-cream hover:bg-forest/90"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}

export default EmptyState

