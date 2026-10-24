import { useEffect } from 'react'

export function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-cream border border-forest/15 p-6 shadow-2xl transition-all sm:p-8">
        <div className="flex items-center justify-between border-b border-forest/10 pb-4">
          <h3
            id="modal-title"
            className="font-display text-xl font-bold text-forest"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 text-charcoal/60 hover:bg-forest/10 hover:text-charcoal focus:outline-none focus:ring-2 focus:ring-forest"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 text-sm text-charcoal/80">{children}</div>

        {footer && <div className="mt-6 border-t border-forest/10 pt-4">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal

