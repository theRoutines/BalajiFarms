export function FormField({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const inputId = id || name

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-charcoal/80"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {children ? (
        children
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-stone-400 transition focus:outline-none focus:ring-2 focus:ring-forest/20 ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
              : 'border-stone-200 hover:border-stone-300 focus:border-forest'
          } ${disabled ? 'bg-stone-50 cursor-not-allowed text-stone-400' : ''}`}
          {...rest}
        />
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}

export default FormField

