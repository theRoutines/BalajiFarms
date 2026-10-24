import { useEffect, useState } from 'react'

export function ImageWithFallback({
  src,
  alt = 'Product image',
  className = '',
  aspectRatio = 'aspect-square',
}) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex ${aspectRatio} w-full flex-col items-center justify-center rounded-2xl bg-forest/10 border border-forest/15 p-6 text-center text-forest transition ${className}`}
      >
        <svg
          className="h-12 w-12 text-forest/70"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.25"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5"
          />
        </svg>
        <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-forest/80 line-clamp-1">
          {alt}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  )
}

export default ImageWithFallback

