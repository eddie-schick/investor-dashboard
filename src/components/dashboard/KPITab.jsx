import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, AreaChart, Area, ReferenceLine as RechartsReferenceLine } from 'recharts'
import { formatCurrency, formatCurrencyCompact } from '@/utils/formatters'
import { getMonthlyValue, computeActiveCustomersWithOnboarding } from '@/utils/ramping'

const KPITab = ({ assumptions, marketOpportunity, baseMarketData, initialCash = 675000, investmentAmount = 500000, investmentMonth = '2025-10' }) => {
  const [granularity, setGranularity] = useState('total') // 'monthly' | 'quarterly' | 'yearly' | 'total'
  const [selectedKey, setSelectedKey] = useState('total')

  // Build timeline months (Aug 2025 - Dec 2027) to match IncomeStatement
  const months = useMemo(() => {
    const result = []
    const startMonth = 7 // Aug (0-indexed)
    const startYear = 2025
    const endMonth = 11 // Dec
    const endYear = 2027
    for (let year = startYear; year <= endYear; year++) {
      const mStart = year === startYear ? startMonth : 0
      const mEnd = year === endYear ? endMonth : 11
      for (let m = mStart; m <= mEnd; m++) {
        result.push({
          month: m,
          year,
          key: `${year}-${String(m + 1).padStart(2, '0')}`,
          label: new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        })
      }
    }
    return result
  }, [])

  // Compute monthly revenue streams exactly as in IncomeStatementTab for reconciliation
  const monthlyData = useMemo(() => {
    const implementationProjects = []
    return months.map((period, index) => {
      // Implementation revenue
      let implementationRevenue = 0
      const countThisMonth = (assumptions.implementationPlan?.[index] ?? 0)
      if (countThisMonth > 0) {
        implementationRevenue = countThisMonth * (assumptions.implementationPrice || 500000)
        implementationProjects.push({ startMonth: index, revenue: implementationRevenue })
      }

      // Customers with optional onboarding ramp
      const monthsSinceStart = index
      const onboardingCustomers = computeActiveCustomersWithOnboarding(assumptions, index, 3816)
      let customers
      if (typeof onboardingCustomers === 'number') {
        customers = onboardingCustomers
      } else {
        const growthMultiplier = 1 + (monthsSinceStart * 0.015)
        const baseCustomers = Math.floor((assumptions.marketPenetration / 100) * 3816 * growthMultiplier)
        const monthlyChurnRate = (assumptions.annualChurnRate / 100) / 12
        const retentionRate = Math.pow(1 - monthlyChurnRate, monthsSinceStart)
        customers = Math.floor(baseCustomers * retentionRate)
      }

      // Subscription (SaaS + Websites)
      const saasPriceThisMonth = getMonthlyValue(assumptions, 'saasBasePricing', index) || 0
      const websitePriceThisMonth = getMonthlyValue(assumptions, 'dealerWebsiteCost', index) || 0
      const subscriptionRevenue = customers * (saasPriceThisMonth + websitePriceThisMonth)

      // Transactional
      const seasonalFactor = [0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.1][period.month]
      const avgTruckPrice = getMonthlyValue(assumptions, 'avgTransactionPrice', index) || 158993
      const tpcYear = getMonthlyValue(assumptions, 'transactionsPerCustomer', index) || 168
      const feeRate = getMonthlyValue(assumptions, 'transactionFeeRate', index) || 0
      const transactionsPerCustomer = (tpcYear / 12) * seasonalFactor
      const transactionRevenue = customers * transactionsPerCustomer * avgTruckPrice * (feeRate / 100)
      const transactionsCount = customers * transactionsPerCustomer

      // Maintenance (percentage of past implementations, after delay)
      let maintenanceRevenue = 0
      const maintenancePercentage = getMonthlyValue(assumptions, 'maintenancePercentage', index) || 18
      const maintenanceStartMonth = Math.round(getMonthlyValue(assumptions, 'maintenanceStartMonth', index) || 3)
      implementationProjects.forEach((p) => {
        const monthsSinceImplementation = index - p.startMonth
        if (monthsSinceImplementation >= maintenanceStartMonth) {
          maintenanceRevenue += (p.revenue * (maintenancePercentage / 100)) / 12
        }
      })

      // Total revenue matches IncomeStatement (subscription + transactional + implementation + maintenance)
      const totalRevenue = subscriptionRevenue + transactionRevenue + implementationRevenue + maintenanceRevenue

      return {
        period,
        customers,
        subscriptionRevenue,
        transactionRevenue,
        implementationRevenue,
        maintenanceRevenue,
        transactionsCount,
        totalRevenue,
      }
    })
  }, [months, assumptions])

  const quarterlyData = useMemo(() => {
    const quarters = []
    for (let i = 0; i < monthlyData.length; i += 3) {
      if (i < monthlyData.length) {
        const group = monthlyData.slice(i, Math.min(i + 3, monthlyData.length))
        const first = group[0]
        const quarterNum = Math.floor(first.period.month / 3) + 1
        const key = `Q${quarterNum}-${first.period.year}`
        quarters.push({
          key,
          label: key,
          customers: Math.round(group.reduce((s, m) => s + m.customers, 0) / group.length),
          subscriptionRevenue: group.reduce((s, m) => s + m.subscriptionRevenue, 0),
          transactionRevenue: group.reduce((s, m) => s + m.transactionRevenue, 0),
          implementationRevenue: group.reduce((s, m) => s + m.implementationRevenue, 0),
          maintenanceRevenue: group.reduce((s, m) => s + m.maintenanceRevenue, 0),
          transactionsCount: group.reduce((s, m) => s + m.transactionsCount, 0),
          totalRevenue: group.reduce((s, m) => s + m.totalRevenue, 0),
        })
      }
    }
    return quarters
  }, [monthlyData])

  const yearlyData = useMemo(() => {
    const years = {}
    monthlyData.forEach((m) => {
      const y = m.period.year
      if (!years[y]) {
        years[y] = {
          key: String(y),
          label: String(y),
          customersSum: 0,
          months: 0,
          subscriptionRevenue: 0,
          transactionRevenue: 0,
          implementationRevenue: 0,
          maintenanceRevenue: 0,
          transactionsCount: 0,
          totalRevenue: 0,
        }
      }
      const row = years[y]
      row.customersSum += m.customers
      row.months += 1
      row.subscriptionRevenue += m.subscriptionRevenue
      row.transactionRevenue += m.transactionRevenue
      row.implementationRevenue += m.implementationRevenue
      row.maintenanceRevenue += m.maintenanceRevenue
      row.transactionsCount += m.transactionsCount
      row.totalRevenue += m.totalRevenue
    })
    return Object.values(years).map((r) => ({
      key: r.key,
      label: r.label,
      customers: Math.round(r.customersSum / r.months),
      subscriptionRevenue: r.subscriptionRevenue,
      transactionRevenue: r.transactionRevenue,
      implementationRevenue: r.implementationRevenue,
      maintenanceRevenue: r.maintenanceRevenue,
      transactionsCount: r.transactionsCount,
      totalRevenue: r.totalRevenue,
    }))
  }, [monthlyData])

  const totalData = useMemo(() => {
    const agg = monthlyData.reduce((s, m) => ({
      customers: s.customers + m.customers,
      subscriptionRevenue: s.subscriptionRevenue + m.subscriptionRevenue,
      transactionRevenue: s.transactionRevenue + m.transactionRevenue,
      implementationRevenue: s.implementationRevenue + m.implementationRevenue,
      maintenanceRevenue: s.maintenanceRevenue + m.maintenanceRevenue,
      transactionsCount: s.transactionsCount + m.transactionsCount,
      totalRevenue: s.totalRevenue + m.totalRevenue,
    }), { customers: 0, subscriptionRevenue: 0, transactionRevenue: 0, implementationRevenue: 0, maintenanceRevenue: 0, transactionsCount: 0, totalRevenue: 0 })
    return { key: 'total', label: 'Total', ...agg }
  }, [monthlyData])

  // Options for select based on granularity
  const periodOptions = useMemo(() => {
    if (granularity === 'monthly') return months.map((m) => ({ key: m.key, label: m.label }))
    if (granularity === 'quarterly') return quarterlyData.map((q) => ({ key: q.key, label: q.label }))
    if (granularity === 'yearly') return yearlyData.map((y) => ({ key: y.key, label: y.label }))
    return [{ key: 'total', label: 'Total' }]
  }, [granularity, months, quarterlyData, yearlyData])

  // Selected period data
  const selectedData = useMemo(() => {
    if (granularity === 'monthly') {
      const found = monthlyData.find((m) => m.period && `${m.period.year}-${String(m.period.month + 1).padStart(2, '0')}` === selectedKey) || monthlyData[0]
      return found
    }
    if (granularity === 'quarterly') {
      return quarterlyData.find((q) => q.key === selectedKey) || quarterlyData[0]
    }
    if (granularity === 'yearly') {
      return yearlyData.find((y) => y.key === selectedKey) || yearlyData[0]
    }
    return totalData
  }, [granularity, selectedKey, monthlyData, quarterlyData, yearlyData, totalData])

  // Growth series for charts (always monthly to visualize trend)
  const cumulativeDealersSeries = useMemo(() => {
    let maxDealers = 0
    return monthlyData.map((m) => {
      maxDealers = Math.max(maxDealers, m.customers)
      return { label: m.period.label, cumulativeDealers: maxDealers }
    })
  }, [monthlyData])

  const revenueByStreamSeries = useMemo(() => (
    monthlyData.map((m) => ({
      label: m.period.label,
      saas: m.subscriptionRevenue,
      tx: m.transactionRevenue,
      impl: m.implementationRevenue,
      maint: m.maintenanceRevenue,
    }))
  ), [monthlyData])
  // Dealers on Platform should reflect the modeled customer count at the END of the selected period
  const dealersOnPlatform = useMemo(() => {
    if (!monthlyData?.length) return 0
    // Monthly → customers for that specific month
    if (granularity === 'monthly') {
      const idx = months.findIndex((m) => m.key === selectedKey)
      return Math.round(idx >= 0 ? (monthlyData[idx]?.customers || 0) : 0)
    }
    // Quarterly → customers at the end of that quarter
    if (granularity === 'quarterly') {
      const match = /^Q(\d)-(\d{4})$/.exec(selectedKey || '')
      if (match) {
        const qNum = parseInt(match[1], 10)
        const year = parseInt(match[2], 10)
        let lastIdx = -1
        months.forEach((m, i) => {
          if (m.year === year && (Math.floor(m.month / 3) + 1) === qNum) lastIdx = i
        })
        return Math.round(lastIdx >= 0 ? (monthlyData[lastIdx]?.customers || 0) : 0)
      }
    }
    // Yearly → customers at the end of the year (Dec)
    if (granularity === 'yearly') {
      const year = parseInt(selectedKey || '0', 10)
      let lastIdx = -1
      months.forEach((m, i) => { if (m.year === year) lastIdx = i })
      return Math.round(lastIdx >= 0 ? (monthlyData[lastIdx]?.customers || 0) : 0)
    }
    // Total → customers at the end of the entire modeled period
    return Math.round(monthlyData[monthlyData.length - 1]?.customers || 0)
  }, [granularity, selectedKey, monthlyData, months])

  const annualSaasRevenue = selectedData?.subscriptionRevenue || 0
  const transactionRevenue = selectedData?.transactionRevenue || 0
  const totalAnnualRevenue = selectedData?.totalRevenue || 0
  const annualTransactions = Math.round(selectedData?.transactionsCount || 0)

  const revenueBreakdown = [
    { name: 'SaaS', value: annualSaasRevenue, color: '#8884d8' },
    { name: 'Transactional', value: transactionRevenue, color: '#82ca9d' },
  ]

  const cac = assumptions.customerAcquisitionCost || 0
  const selectedMonthIndex = useMemo(() => {
    if (granularity !== 'monthly') return -1
    return months.findIndex((m) => m.key === selectedKey)
  }, [granularity, months, selectedKey])
  const pricePerMonth = selectedMonthIndex >= 0 ? (getMonthlyValue(assumptions, 'saasBasePricing', selectedMonthIndex) || 0) : (assumptions.saasBasePricing || 0)
  const cacPaybackMonths = pricePerMonth > 0 ? Math.round(cac / pricePerMonth) : 0

  const ltv = marketOpportunity.customerLifetimeValue || 0
  const ltvcac = marketOpportunity.ltvcacRatio || 0

  const avgTransactionPrice = selectedMonthIndex >= 0
    ? (getMonthlyValue(assumptions, 'avgTransactionPrice', selectedMonthIndex) || baseMarketData.avgTruckPrice)
    : (assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice)

  // Additional KPI values for snapshot
  const saasMonthlyPrice = selectedMonthIndex >= 0
    ? (getMonthlyValue(assumptions, 'saasBasePricing', selectedMonthIndex) || 0)
    : (assumptions.saasBasePricing || 0)
  const websiteMonthlyPrice = selectedMonthIndex >= 0
    ? (getMonthlyValue(assumptions, 'dealerWebsiteCost', selectedMonthIndex) || 0)
    : (assumptions.dealerWebsiteCost || 0)
  const feeRatePct = selectedMonthIndex >= 0
    ? (getMonthlyValue(assumptions, 'transactionFeeRate', selectedMonthIndex) || 0)
    : (assumptions.transactionFeeRate || 0)
  const avgTransactionalRevenuePerUnit = avgTransactionPrice * (feeRatePct / 100)

  const avgRevenuePerCustomer = dealersOnPlatform > 0 ? totalAnnualRevenue / dealersOnPlatform : 0

  // Cash balance series (Aug 2025–Dec 2027) using same formulas as IncomeStatementTab
  const cashBalanceSeries = useMemo(() => {
    let cumulativeCashBalance = initialCash
    const implementationProjects = []
    return months.map((period, index) => {
      // Implementation revenue and project tracking
      let implementationRevenue = 0
      const countThisMonth = (assumptions.implementationPlan?.[index] ?? 0)
      if (countThisMonth > 0) {
        implementationRevenue = countThisMonth * (assumptions.implementationPrice || 500000)
        implementationProjects.push({ startMonth: index, revenue: implementationRevenue })
      }

      // Customers
      const monthsSinceStart = index
      const onboardingCustomers = computeActiveCustomersWithOnboarding(assumptions, index, 3816)
      let customers
      if (typeof onboardingCustomers === 'number') {
        customers = onboardingCustomers
      } else {
        const growthMultiplier = 1 + (monthsSinceStart * 0.015)
        const baseCustomers = Math.floor((assumptions.marketPenetration / 100) * 3816 * growthMultiplier)
        const monthlyChurnRate = (assumptions.annualChurnRate / 100) / 12
        const retentionRate = Math.pow(1 - monthlyChurnRate, monthsSinceStart)
        customers = Math.floor(baseCustomers * retentionRate)
      }

      // Revenue components
      const saasPriceThisMonth = getMonthlyValue(assumptions, 'saasBasePricing', index) || 0
      const websitePriceThisMonth = getMonthlyValue(assumptions, 'dealerWebsiteCost', index) || 0
      const subscriptionRevenue = customers * (saasPriceThisMonth + websitePriceThisMonth)
      const seasonalFactor = [0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.1][period.month]
      const avgTruckPrice = getMonthlyValue(assumptions, 'avgTransactionPrice', index) || 158993
      const tpcYear = getMonthlyValue(assumptions, 'transactionsPerCustomer', index) || 168
      const feeRate = getMonthlyValue(assumptions, 'transactionFeeRate', index) || 0
      const transactionsPerCustomer = (tpcYear / 12) * seasonalFactor
      const transactionRevenue = customers * transactionsPerCustomer * avgTruckPrice * (feeRate / 100)

      let maintenanceRevenue = 0
      const maintenancePercentage = getMonthlyValue(assumptions, 'maintenancePercentage', index) || 18
      const maintenanceStartMonth = Math.round(getMonthlyValue(assumptions, 'maintenanceStartMonth', index) || 3)
      implementationProjects.forEach((p) => {
        const monthsSinceImplementation = index - p.startMonth
        if (monthsSinceImplementation >= maintenanceStartMonth) {
          maintenanceRevenue += (p.revenue * (maintenancePercentage / 100)) / 12
        }
      })

      const totalRevenue = subscriptionRevenue + transactionRevenue + implementationRevenue + maintenanceRevenue

      // Expenses (match IncomeStatement defaults)
      const expensePayroll = getMonthlyValue(assumptions, 'expensePayroll', index) || 110000
      const expenseContractors = getMonthlyValue(assumptions, 'expenseContractors', index) || 50000
      const contractorSpikePct = getMonthlyValue(assumptions, 'contractorsSpikePercentage', index) ?? 0
      const contractorSpike = implementationRevenue > 0 ? implementationRevenue * (contractorSpikePct / 100) : 0
      const expenseTravelMarketing = getMonthlyValue(assumptions, 'expenseTravelMarketing', index) || 30000
      const expenseLicenseFees = getMonthlyValue(assumptions, 'expenseLicenseFees', index) || 15000
      const expenseSharedServices = getMonthlyValue(assumptions, 'expenseSharedServices', index) || 18000
      const expenseLegal = getMonthlyValue(assumptions, 'expenseLegal', index) || 10000
      const expenseCompanyVehicle = getMonthlyValue(assumptions, 'expenseCompanyVehicle', index) || 6000
      const expenseInsurance = getMonthlyValue(assumptions, 'expenseInsurance', index) || 5000
      const expenseContingencies = getMonthlyValue(assumptions, 'expenseContingencies', index) || 5000
      const expenseConsultantAudit = getMonthlyValue(assumptions, 'expenseConsultantAudit', index) || 2000

      const totalExpenses =
        expensePayroll +
        expenseContractors +
        contractorSpike +
        expenseTravelMarketing +
        expenseLicenseFees +
        expenseSharedServices +
        expenseLegal +
        expenseCompanyVehicle +
        expenseInsurance +
        expenseContingencies +
        expenseConsultantAudit

      const netIncome = totalRevenue - totalExpenses
      const investmentInflow = period.key === investmentMonth ? (investmentAmount || 0) : 0
      cumulativeCashBalance += netIncome + investmentInflow
      return { label: period.label, cash: cumulativeCashBalance }
    })
  }, [months, assumptions, initialCash, investmentAmount, investmentMonth])

  // Compute a dynamic Y-axis domain with padding for the cash chart to avoid cramped scaling
  const cashYAxisDomain = useMemo(() => {
    if (!cashBalanceSeries || cashBalanceSeries.length === 0) return ['auto', 'auto']
    const values = cashBalanceSeries.map((d) => d.cash)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = Math.max(1, max - min)
    const pad = range * 0.05
    return [min - pad, max + pad]
  }, [cashBalanceSeries])

  // Default selection per granularity
  const defaultKeyFor = (value) => {
    if (value === 'monthly') {
      const dec2026 = months.find((m) => m.year === 2026 && m.month === 11)
      return dec2026?.key || months[0]?.key || 'total'
    }
    if (value === 'quarterly') {
      const q4_2026 = quarterlyData.find((q) => q.key === 'Q4-2026')
      return q4_2026?.key || quarterlyData[0]?.key || 'total'
    }
    if (value === 'yearly') {
      const y2025 = yearlyData.find((y) => y.key === '2025')
      return y2025?.key || yearlyData[0]?.key || 'total'
    }
    return 'total'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Analyze KPIs by month, quarter, year, or total</CardDescription>
            {granularity === 'total' && (
              <div className="text-xs text-muted-foreground mt-1">Total covers Aug 2025 – Dec 2027</div>
            )}
          </div>
          <div className="flex gap-3 items-center">
            <Tabs value={granularity} onValueChange={(v) => { setGranularity(v); setSelectedKey(defaultKeyFor(v)) }}>
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
                <TabsTrigger value="total">Total</TabsTrigger>
              </TabsList>
            </Tabs>
            {granularity !== 'total' && (
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Dealers on Platform</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{dealersOnPlatform.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{
            granularity === 'monthly'
              ? 'Monthly Transactions'
              : granularity === 'quarterly'
                ? 'Quarterly Transactions'
                : granularity === 'total'
                  ? 'Total Transactions'
                  : 'Annual Transactions'
          }</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{annualTransactions.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ARR (SaaS)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(annualSaasRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{
            granularity === 'monthly'
              ? 'Total Monthly Revenue'
              : granularity === 'quarterly'
                ? 'Total Quarter Revenue'
                : granularity === 'total'
                  ? 'Total Revenue'
                  : 'Total Annual Revenue'
          }</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalAnnualRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">CAC Payback</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{cacPaybackMonths} mo</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">LTV / CAC</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{ltvcac.toFixed(1)}x</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashBalanceSeries} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" hide={true} />
                <YAxis domain={cashYAxisDomain} tickFormatter={(v) => formatCurrencyCompact(Number(v))} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <RechartsReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                <Bar dataKey="cash" fill="#60a5fa" name="Cash Balance" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KPI Snapshot</CardTitle>
            <CardDescription>Key model metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Avg Revenue per Customer (annual)</TableCell>
                  <TableCell className="font-medium">{formatCurrency(avgRevenuePerCustomer)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Avg SaaS Subscription Price</TableCell>
                  <TableCell className="font-medium">{formatCurrency(saasMonthlyPrice)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Avg Dealer Website Price</TableCell>
                  <TableCell className="font-medium">{formatCurrency(websiteMonthlyPrice)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Annual Transactions</TableCell>
                  <TableCell className="font-medium">{annualTransactions.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Avg Transactional Revenue per Unit</TableCell>
                  <TableCell className="font-medium">{formatCurrency(avgTransactionalRevenuePerUnit)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Customer Lifetime Value (LTV)</TableCell>
                  <TableCell className="font-medium">{formatCurrency(ltv)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Dealers Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeDealersSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" hide={true} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cumulativeDealers" stroke="#8884d8" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Stream (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByStreamSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" hide={true} />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="saas" stackId="1" fill="#8884d8" name="SaaS" />
                <Bar dataKey="tx" stackId="1" fill="#82ca9d" name="Transactional" />
                <Bar dataKey="websites" stackId="1" fill="#ffc658" name="Websites" />
                <Bar dataKey="leadgen" stackId="1" fill="#ff7300" name="Lead Gen" />
                <Bar dataKey="impl" stackId="1" fill="#6b7280" name="Implementation" />
                <Bar dataKey="maint" stackId="1" fill="#60a5fa" name="Maintenance" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default KPITab


