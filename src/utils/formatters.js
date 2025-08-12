// Utility functions for formatting numbers and currencies

export const formatCurrency = (value) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

export const formatNumber = (value) => {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  return value.toLocaleString()
}

// Compact currency with k/m/b units and parentheses for negatives, e.g., ($234k)
export const formatCurrencyCompact = (value) => {
  const isNegative = value < 0
  const abs = Math.abs(value)

  let compact
  if (abs >= 1e9) compact = `$${(abs / 1e9).toFixed(1)}b`
  else if (abs >= 1e6) compact = `$${(abs / 1e6).toFixed(1)}m`
  else if (abs >= 1e3) compact = `$${(abs / 1e3).toFixed(0)}k`
  else compact = `$${abs.toFixed(0)}`

  return isNegative ? `(${compact})` : compact
}


