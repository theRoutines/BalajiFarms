export function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeMap = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  const spinnerClass = sizeMap[size] || sizeMap.md

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <div
        className={`${spinnerClass} animate-spin rounded-full border-forest/20 border-t-forest`}
      />
      {text && <p className="mt-3 text-sm text-charcoal/70">{text}</p>}
      <span className="sr-only">{text}</span>
    </div>
  )
}

export default Loader

