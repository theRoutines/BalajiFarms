export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
}) {
  return (
    <div
      role="alert"
      className="my-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-rose-900"
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600"
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
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <div className="flex-1 text-sm">
          <h4 className="font-semibold text-rose-950">{title}</h4>
          {message && <p className="mt-1 text-rose-800">{message}</p>}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center text-xs font-semibold underline hover:text-rose-950 focus:outline-none"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage

