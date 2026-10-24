export function QuantityStepper({
  quantity = 1,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
}) {
  function handleDecrement() {
    if (disabled || quantity <= min) return
    onChange(quantity - 1)
  }

  function handleIncrement() {
    if (disabled || quantity >= max) return
    onChange(quantity + 1)
  }

  return (
    <div className="inline-flex items-center rounded-full border border-forest/20 bg-cream p-1 shadow-sm">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || quantity <= min}
        onClick={handleDecrement}
        className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition hover:bg-forest/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-base font-bold">−</span>
      </button>

      <span className="w-10 text-center font-semibold text-charcoal select-none">
        {quantity}
      </span>

      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || quantity >= max}
        onClick={handleIncrement}
        className="flex h-8 w-8 items-center justify-center rounded-full text-forest transition hover:bg-forest/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-base font-bold">+</span>
      </button>
    </div>
  )
}

export default QuantityStepper

