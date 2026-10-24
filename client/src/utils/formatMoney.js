export function formatMoney(paise) {
  const numericPaise = Number(paise) || 0
  const rupees = numericPaise / 100
  const hasDecimals = numericPaise % 100 !== 0

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(rupees)

  return `₹${formatted}`
}

