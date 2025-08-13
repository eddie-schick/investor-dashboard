// Helpers to apply monthly ramps and overrides to assumptions

/**
 * Returns the value of an assumption for a specific month index.
 * Priority: monthlyOverrides[key][idx] -> ramped value -> base value
 */
export const getMonthlyValue = (assumptions, key, monthIndex) => {
  const overrides = assumptions.monthlyOverrides?.[key]
  if (Array.isArray(overrides) && typeof overrides[monthIndex] === 'number') {
    return overrides[monthIndex]
  }
  const baseValue = assumptions[key]
  const rampCfg = assumptions.ramps?.[key]
  if (rampCfg?.enabled && typeof rampCfg.monthlyPercent === 'number') {
    const pct = rampCfg.monthlyPercent / 100
    const startMonth = typeof rampCfg.startMonth === 'number' ? rampCfg.startMonth : 0
    const elapsed = Math.max(0, monthIndex - startMonth)
    const factor = Math.pow(1 + pct, elapsed)
    return typeof baseValue === 'number' ? baseValue * factor : baseValue
  }
  return baseValue
}

/**
 * Computes active customers using an onboarding plan and churn.
 * Returns null when onboarding plan is not enabled so callers can fall back to default logic.
 */
export const computeActiveCustomersWithOnboarding = (
  assumptions,
  monthIndex,
  totalDealerships
) => {
  if (!assumptions.useOnboardingPlan) return null
  const targetDealers = Math.floor(totalDealerships * (assumptions.marketPenetration / 100))
  const monthlyChurnRate = (assumptions.annualChurnRate / 100) / 12

  let active = 0
  for (let i = 0; i <= monthIndex; i++) {
    const added = assumptions.onboardingPlan?.[i] ?? 0
    active = Math.floor(active * (1 - monthlyChurnRate)) + added
    if (active > targetDealers) active = targetDealers
  }
  return active
}



