export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...rest
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variantStyles = {
    primary:
      'bg-terracotta text-white hover:bg-terracotta-dark focus:ring-terracotta shadow-sm active:translate-y-px',
    secondary:
      'bg-cream border border-espresso text-espresso hover:bg-espresso hover:text-cream focus:ring-espresso',
    botanical:
      'bg-forest text-cream hover:bg-forest-dark focus:ring-forest shadow-sm',
    outline:
      'border border-husk-dark text-espresso bg-white hover:bg-linen/70 focus:ring-terracotta',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-500 shadow-sm',
    ghost:
      'text-espresso/80 hover:text-terracotta hover:bg-terracotta/5 focus:ring-terracotta',
  }

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-md',
    md: 'text-sm px-5 py-2.5 gap-2 rounded-lg',
    lg: 'text-base px-7 py-3.5 gap-2.5 rounded-lg',
  }

  const selectedVariant = variantStyles[variant] || variantStyles.primary
  const selectedSize = sizeStyles[size] || sizeStyles.md

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${selectedVariant} ${selectedSize} ${className}`}
      {...rest}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      <span>{children}</span>
    </button>
  )
}

export default Button
