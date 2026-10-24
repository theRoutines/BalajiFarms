import React from 'react'

/**
 * Reusable infinite horizontal scrolling marquee / ticker
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Custom content to repeat
 * @param {string[]} [props.items] - List of string items to display with separators
 * @param {string} [props.separator="•"] - Separator between items
 * @param {string} [props.speed="30s"] - Animation duration (e.g. "20s", "30s", "40s")
 * @param {boolean} [props.reverse=false] - Scroll left-to-right instead of right-to-left
 * @param {boolean} [props.pauseOnHover=true] - Pause ticker when hovered
 * @param {string} [props.className=""] - Wrapper styles
 * @param {string} [props.innerClassName=""] - Text track styles
 */
export function Marquee({
  children,
  items,
  separator = '•',
  speed = '28s',
  reverse = false,
  pauseOnHover = true,
  className = '',
  innerClassName = '',
}) {
  const displayItems = items ? [...items, ...items] : null

  const content = children || (
    displayItems && (
      <div className="flex items-center gap-6 sm:gap-8 px-4">
        {displayItems.map((item, idx) => (
          <React.Fragment key={idx}>
            <span className="whitespace-nowrap tracking-wide">{item}</span>
            {separator && (
              <span className="opacity-50 select-none text-xs sm:text-sm font-light">
                {separator}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    )
  )

  const animClass = reverse ? 'marquee-backward' : 'marquee-forward'
  const pauseClass = pauseOnHover ? 'marquee-pause-hover' : ''

  return (
    <div
      className={`marquee-container group relative flex overflow-hidden select-none w-full ${className}`}
    >
      <div
        className={`marquee-content-track ${animClass} ${pauseClass} ${innerClassName}`}
        style={{ animationDuration: speed }}
      >
        {content}
      </div>
      <div
        aria-hidden="true"
        className={`marquee-content-track ${animClass} ${pauseClass} ${innerClassName}`}
        style={{ animationDuration: speed }}
      >
        {content}
      </div>
    </div>
  )
}

export default Marquee

