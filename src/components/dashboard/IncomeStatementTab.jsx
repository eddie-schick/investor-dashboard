import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatCurrencyCompact } from '@/utils/formatters'
import { getMonthlyValue, computeActiveCustomersWithOnboarding } from '@/utils/ramping'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'

const IncomeStatementTab = ({ 
  assumptions,
  initialCash,
  setInitialCash,
  initialCashDate,
  setInitialCashDate,
  investmentAmount,
  setInvestmentAmount,
  investmentMonth,
  setInvestmentMonth
}) => {
  const [view, setView] = useState('monthly')
  const [isEditing, setIsEditing] = useState(false)
  const [overrides, setOverrides] = useState({}) // { [monthIndex]: { subscriptionRevenue, transactionRevenue, implementationRevenue, maintenanceRevenue, totalExpenses, investmentInflow } }
  // Cash settings come from parent via props

  // Generate months from Aug 2025 to Dec 2027
  const months = useMemo(() => {
    const result = []
    const startMonth = 7 // August (0-indexed)
    const startYear = 2025
    const endMonth = 11 // December (0-indexed)
    const endYear = 2027
    
    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonth : 0
      const monthEnd = year === endYear ? endMonth : 11
      
      for (let month = monthStart; month <= monthEnd; month++) {
        result.push({
          month: month,
          year: year,
          label: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          key: `${year}-${String(month + 1).padStart(2, '0')}`
        })
      }
    }
    
    return result
  }, [])
  
  // Calculate monthly income statement values based on assumptions
  const incomeData = useMemo(() => {
    // No scaling; use base assumptions directly

    let cumulativeCashBalance = initialCash || 0
    let implementationProjects = [] // Track implementation projects for maintenance revenue calculations
    
    return months.map((period, index) => {
      // Implementation engagements - user-defined monthly plan (defaults to 0 per month)
      let implementationRevenue = 0
      const countThisMonth = (assumptions.implementationPlan?.[index] ?? 0)
      if (countThisMonth > 0) {
        implementationRevenue = countThisMonth * (assumptions.implementationPrice || 500000)
        implementationProjects.push({ startMonth: index, revenue: implementationRevenue })
      }
      
      // Customers: either onboarding plan with churn, or legacy penetration growth
      const monthsSinceStart = index
      const onboardingCustomers = computeActiveCustomersWithOnboarding(assumptions, index, 3816)
      let customers
      if (typeof onboardingCustomers === 'number') {
        customers = onboardingCustomers
      } else {
        const growthMultiplier = 1 + (monthsSinceStart * 0.015) // 1.5% growth per month
        const baseCustomers = Math.floor((assumptions.marketPenetration / 100) * 3816 * growthMultiplier)
        const monthlyChurnRate = assumptions.annualChurnRate / 100 / 12
        const retentionRate = Math.pow(1 - monthlyChurnRate, monthsSinceStart)
        customers = Math.floor(baseCustomers * retentionRate)
      }
      
      // Calculate subscription revenue (SaaS base + dealer website)
      const saasPriceThisMonth = getMonthlyValue(assumptions, 'saasBasePricing', index) || 0
      const websitePriceThisMonth = getMonthlyValue(assumptions, 'dealerWebsiteCost', index) || 0
      const priceThisMonth = saasPriceThisMonth + websitePriceThisMonth
      const subscriptionRevenue = customers * priceThisMonth
      
      // Calculate transactional revenue - seasonal with peaks
      const seasonalFactor = [0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.1][period.month]
      const avgTruckPrice = getMonthlyValue(assumptions, 'avgTransactionPrice', index) || 158993
      const tpcYear = getMonthlyValue(assumptions, 'transactionsPerCustomer', index) || 168
      const feeRate = getMonthlyValue(assumptions, 'transactionFeeRate', index) || 0
      const transactionsPerCustomer = (tpcYear) / 12 * seasonalFactor // monthly average
      const transactionRevenue = customers * transactionsPerCustomer * avgTruckPrice * (feeRate / 100)
      
      // Calculate maintenance revenue (% of implementation revenue, starting X months after implementation)
      let maintenanceRevenue = 0
      const maintenancePercentage = getMonthlyValue(assumptions, 'maintenancePercentage', index) || 18
      const maintenanceStartMonth = Math.round(getMonthlyValue(assumptions, 'maintenanceStartMonth', index) || 3)
       
       // Look at all past implementation projects to calculate maintenance
      implementationProjects.forEach(project => {
        const monthsSinceImplementation = index - project.startMonth
        // Start maintenance after the configured delay
        if (monthsSinceImplementation >= maintenanceStartMonth) {
          // Calculate monthly maintenance fee
          maintenanceRevenue += (project.revenue * (maintenancePercentage / 100)) / 12
        }
      })
      // Investment inflow for selected month (one-time)
      const investmentInflow = period.key === investmentMonth ? (investmentAmount || 0) : 0
      
      // Calculate expenses as fixed monthly dollar amounts (with optional monthly overrides/ramps)
      const expensePayroll = getMonthlyValue(assumptions, 'expensePayroll', index) || 110000
      const expenseContractors = getMonthlyValue(assumptions, 'expenseContractors', index) || 50000
      // Add contractor spike during implementation months (based on implementation revenue)
      const contractorSpikePct = getMonthlyValue(assumptions, 'contractorsSpikePercentage', index)
      const contractorSpike = implementationRevenue > 0 ? implementationRevenue * ((contractorSpikePct ?? 0) / 100) : 0
      const expenseTravelMarketing = getMonthlyValue(assumptions, 'expenseTravelMarketing', index) || 30000
      const expenseLicenseFees = getMonthlyValue(assumptions, 'expenseLicenseFees', index) || 15000
      const expenseSharedServices = getMonthlyValue(assumptions, 'expenseSharedServices', index) || 18000
      const expenseLegal = getMonthlyValue(assumptions, 'expenseLegal', index) || 10000
      const expenseCompanyVehicle = getMonthlyValue(assumptions, 'expenseCompanyVehicle', index) || 6000
      const expenseInsurance = getMonthlyValue(assumptions, 'expenseInsurance', index) || 5000
      const expenseContingencies = getMonthlyValue(assumptions, 'expenseContingencies', index) || 5000
      const expenseConsultantAudit = getMonthlyValue(assumptions, 'expenseConsultantAudit', index) || 2000
      
      // Total expenses
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
      
      // Apply manual overrides if present
      const o = overrides[index] || {}
      const effectiveSubscription = typeof o.subscriptionRevenue === 'number' ? o.subscriptionRevenue : subscriptionRevenue
      const effectiveTransactional = typeof o.transactionRevenue === 'number' ? o.transactionRevenue : transactionRevenue
      const effectiveImplementation = typeof o.implementationRevenue === 'number' ? o.implementationRevenue : implementationRevenue
      const effectiveMaintenance = typeof o.maintenanceRevenue === 'number' ? o.maintenanceRevenue : maintenanceRevenue
      const effectiveInvestmentInflow = typeof o.investmentInflow === 'number' ? o.investmentInflow : investmentInflow
      const effectiveTotalExpenses = typeof o.totalExpenses === 'number' ? o.totalExpenses : totalExpenses

      // Calculate total revenue
      const totalRevenue = effectiveSubscription + effectiveTransactional + effectiveImplementation + effectiveMaintenance

      // Net Income
      const netIncome = totalRevenue - effectiveTotalExpenses
      
      // Update cumulative cash balance
      cumulativeCashBalance += netIncome + effectiveInvestmentInflow
      
      return {
        period,
         subscriptionRevenue: effectiveSubscription,
         transactionRevenue: effectiveTransactional,
         implementationRevenue: effectiveImplementation,
         maintenanceRevenue: effectiveMaintenance,
         investmentInflow: effectiveInvestmentInflow,
         totalRevenue,
        expenses: {
          payroll: expensePayroll,
          contractors: expenseContractors + contractorSpike,
          travelMarketing: expenseTravelMarketing,
          licenseFees: expenseLicenseFees,
          sharedServices: expenseSharedServices,
          legal: expenseLegal,
          companyVehicle: expenseCompanyVehicle,
          insurance: expenseInsurance,
          contingencies: expenseContingencies,
          consultantAudit: expenseConsultantAudit
        },
         totalExpenses: effectiveTotalExpenses,
         netIncome,
        cumulativeCashBalance
      }
    })
  }, [months, assumptions, initialCash, investmentAmount, investmentMonth, overrides])

  // Create quarterly aggregated data
  const quarterlyData = useMemo(() => {
    const quarters = []
    
    // Group months into quarters
    for (let i = 0; i < incomeData.length; i += 3) {
      // Ensure we have at least one month for this quarter
      if (i < incomeData.length) {
        // Get up to 3 months for this quarter
        const monthsInQuarter = incomeData.slice(i, Math.min(i + 3, incomeData.length))
        const firstMonth = monthsInQuarter[0]
        
        // Create quarter label (e.g. "Q3 2025")
        const quarterNum = Math.floor(firstMonth.period.month / 3) + 1
        const quarterLabel = `Q${quarterNum} ${firstMonth.period.year}`
        
        // Sum revenue and expenses across months in this quarter
        const quarterData = {
          label: quarterLabel,
          subscriptionRevenue: monthsInQuarter.reduce((sum, month) => sum + month.subscriptionRevenue, 0),
          transactionRevenue: monthsInQuarter.reduce((sum, month) => sum + month.transactionRevenue, 0),
          implementationRevenue: monthsInQuarter.reduce((sum, month) => sum + month.implementationRevenue, 0),
          maintenanceRevenue: monthsInQuarter.reduce((sum, month) => sum + month.maintenanceRevenue, 0),
          investmentInflow: monthsInQuarter.reduce((sum, month) => sum + month.investmentInflow, 0),
          totalRevenue: monthsInQuarter.reduce((sum, month) => sum + month.totalRevenue, 0),
          expenses: {
            payroll: monthsInQuarter.reduce((sum, month) => sum + month.expenses.payroll, 0),
            contractors: monthsInQuarter.reduce((sum, month) => sum + month.expenses.contractors, 0),
            travelMarketing: monthsInQuarter.reduce((sum, month) => sum + month.expenses.travelMarketing, 0),
            licenseFees: monthsInQuarter.reduce((sum, month) => sum + month.expenses.licenseFees, 0),
            sharedServices: monthsInQuarter.reduce((sum, month) => sum + month.expenses.sharedServices, 0),
            legal: monthsInQuarter.reduce((sum, month) => sum + month.expenses.legal, 0),
            companyVehicle: monthsInQuarter.reduce((sum, month) => sum + month.expenses.companyVehicle, 0),
            insurance: monthsInQuarter.reduce((sum, month) => sum + month.expenses.insurance, 0),
            contingencies: monthsInQuarter.reduce((sum, month) => sum + month.expenses.contingencies, 0),
            consultantAudit: monthsInQuarter.reduce((sum, month) => sum + month.expenses.consultantAudit, 0)
          },
          totalExpenses: monthsInQuarter.reduce((sum, month) => sum + month.totalExpenses, 0),
          netIncome: monthsInQuarter.reduce((sum, month) => sum + month.netIncome, 0),
          // Use the last month's cumulative cash balance
          cumulativeCashBalance: monthsInQuarter[monthsInQuarter.length - 1].cumulativeCashBalance
        }
        
        quarters.push(quarterData)
      }
    }
    
    return quarters
  }, [incomeData])

  // Create yearly aggregated data
  const yearlyData = useMemo(() => {
    const yearToMonths = new Map()
    for (const monthData of incomeData) {
      const y = monthData.period.year
      if (!yearToMonths.has(y)) {
        yearToMonths.set(y, [])
      }
      yearToMonths.get(y).push(monthData)
    }

    const years = []
    for (const [year, monthsInYear] of yearToMonths.entries()) {
      const yearData = {
        label: String(year),
        subscriptionRevenue: monthsInYear.reduce((sum, m) => sum + m.subscriptionRevenue, 0),
        transactionRevenue: monthsInYear.reduce((sum, m) => sum + m.transactionRevenue, 0),
        implementationRevenue: monthsInYear.reduce((sum, m) => sum + m.implementationRevenue, 0),
        maintenanceRevenue: monthsInYear.reduce((sum, m) => sum + m.maintenanceRevenue, 0),
        investmentInflow: monthsInYear.reduce((sum, m) => sum + (m.investmentInflow || 0), 0),
        totalRevenue: monthsInYear.reduce((sum, m) => sum + m.totalRevenue, 0),
        expenses: {
          payroll: monthsInYear.reduce((sum, m) => sum + m.expenses.payroll, 0),
          contractors: monthsInYear.reduce((sum, m) => sum + m.expenses.contractors, 0),
          travelMarketing: monthsInYear.reduce((sum, m) => sum + m.expenses.travelMarketing, 0),
          licenseFees: monthsInYear.reduce((sum, m) => sum + m.expenses.licenseFees, 0),
          sharedServices: monthsInYear.reduce((sum, m) => sum + m.expenses.sharedServices, 0),
          legal: monthsInYear.reduce((sum, m) => sum + m.expenses.legal, 0),
          companyVehicle: monthsInYear.reduce((sum, m) => sum + m.expenses.companyVehicle, 0),
          insurance: monthsInYear.reduce((sum, m) => sum + m.expenses.insurance, 0),
          contingencies: monthsInYear.reduce((sum, m) => sum + m.expenses.contingencies, 0),
          consultantAudit: monthsInYear.reduce((sum, m) => sum + m.expenses.consultantAudit, 0)
        },
        totalExpenses: monthsInYear.reduce((sum, m) => sum + m.totalExpenses, 0),
        netIncome: monthsInYear.reduce((sum, m) => sum + m.netIncome, 0),
        cumulativeCashBalance: monthsInYear[monthsInYear.length - 1].cumulativeCashBalance
      }
      years.push(yearData)
    }

    // Preserve chronological order
    return years.sort((a, b) => Number(a.label) - Number(b.label))
  }, [incomeData])

  // Toggle between monthly/quarterly/expense breakdown views
  const handleViewChange = (newView) => {
    setView(newView)
  }
  
  // Determine which data set to use
  const displayData = view === 'quarterly' ? quarterlyData : (view === 'yearly' ? yearlyData : incomeData)

  // Helpers to build hover explanations (monthly view)
  const formatPercent = (value) => `${Number(value || 0).toFixed(2).replace(/\.00$/, '')}%`

  const computeCustomersForMonth = (monthIndex) => {
    const monthsSinceStart = monthIndex
    const onboardingCustomers = computeActiveCustomersWithOnboarding(assumptions, monthIndex, 3816)
    if (typeof onboardingCustomers === 'number') return onboardingCustomers
    const growthMultiplier = 1 + (monthsSinceStart * 0.015)
    const baseCustomers = Math.floor((assumptions.marketPenetration / 100) * 3816 * growthMultiplier)
    const monthlyChurnRate = assumptions.annualChurnRate / 100 / 12
    const retentionRate = Math.pow(1 - monthlyChurnRate, monthsSinceStart)
    return Math.floor(baseCustomers * retentionRate)
  }

  const seasonalFactorForMonth = (monthIdx0) => [0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.1][monthIdx0]

  const SubscriptionHover = ({ index, label, value }) => {
    const customers = computeCustomersForMonth(index)
    const saas = getMonthlyValue(assumptions, 'saasBasePricing', index) || 0
    const website = getMonthlyValue(assumptions, 'dealerWebsiteCost', index) || 0
    const total = saas + website
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-help">{formatCurrency(value)}</HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-1">
            <div className="font-medium">Subscription revenue — {label}</div>
            <div className="text-sm text-muted-foreground">Formula</div>
            <div className="text-sm">customers × (SaaS base + Dealer website)</div>
            <div className="text-sm">{customers.toLocaleString()} × ({formatCurrency(saas)} + {formatCurrency(website)}) = {formatCurrency(value)}</div>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const TransactionalHover = ({ index, label, value, month0 }) => {
    const customers = computeCustomersForMonth(index)
    const avgPrice = getMonthlyValue(assumptions, 'avgTransactionPrice', index) || 158993
    const tpcYear = getMonthlyValue(assumptions, 'transactionsPerCustomer', index) || 168
    const feeRate = getMonthlyValue(assumptions, 'transactionFeeRate', index) || 0
    const s = seasonalFactorForMonth(month0)
    const tpcMonthly = (tpcYear / 12) * s
    const monthlySales = tpcMonthly
    const volume = customers * monthlySales
    const feePerSale = avgPrice * (feeRate / 100)
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-help">{formatCurrency(value)}</HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-1">
            <div className="font-medium">Transactional revenue — {label}</div>
            <div className="text-sm text-muted-foreground">Formula</div>
            <div className="text-sm">Volume × Transaction fee</div>
            <div className="text-sm">Volume: {volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            <div className="text-sm">Transaction fee: {formatCurrency(feePerSale)}</div>
            <div className="text-sm">Result: {volume.toLocaleString(undefined, { maximumFractionDigits: 2 })} × {formatCurrency(feePerSale)} = {formatCurrency(value)}</div>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const ImplementationHover = ({ index, label, value }) => {
    const count = assumptions.implementationPlan?.[index] ?? 0
    const price = assumptions.implementationPrice || 500000
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-help">{formatCurrency(value)}</HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-1">
            <div className="font-medium">Implementation revenue — {label}</div>
            <div className="text-sm text-muted-foreground">Formula</div>
            <div className="text-sm">projects × price per implementation</div>
            <div className="text-sm">{count} × {formatCurrency(price)} = {formatCurrency(value)}</div>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const MaintenanceHover = ({ index, label, value }) => {
    const pct = getMonthlyValue(assumptions, 'maintenancePercentage', index) || 18
    const startDelay = Math.round(getMonthlyValue(assumptions, 'maintenanceStartMonth', index) || 3)
    // Sum maintenance-producing implementations up to this month
    const eligible = incomeData
      .map((m, i) => ({ i, impl: m.implementationRevenue }))
      .filter(({ i, impl }) => i <= index - startDelay && impl > 0)
    const perMonth = eligible.reduce((sum, { impl }) => sum + (impl * (pct / 100)) / 12, 0)
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-help">{formatCurrency(value)}</HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-1">
            <div className="font-medium">Maintenance revenue — {label}</div>
            <div className="text-sm text-muted-foreground">Formula</div>
            <div className="text-sm">Σ past implementations × {formatPercent(pct)} ÷ 12 (start after {startDelay} mo)</div>
            <div className="text-sm">Current month maintenance base: {formatCurrency(perMonth)}</div>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const TotalRevenueHover = ({ label, value, components }) => (
    <HoverCard>
      <HoverCardTrigger className="cursor-help font-medium">{formatCurrency(value)}</HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-1">
          <div className="font-medium">Total revenue — {label}</div>
          <div className="text-sm">Subscription {formatCurrency(components.subscription)} + Transactional {formatCurrency(components.transactional)} + Implementation {formatCurrency(components.implementation)} + Maintenance {formatCurrency(components.maintenance)} = {formatCurrency(value)}</div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )

  const ExpensesHover = ({ label, data, index }) => {
    const contractorSpikePct = getMonthlyValue(assumptions, 'contractorsSpikePercentage', index) ?? 0
    const contractorsBase = getMonthlyValue(assumptions, 'expenseContractors', index) || 50000
    const spike = Math.max(0, data.expenses.contractors - contractorsBase)
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-help">{formatCurrency(data.totalExpenses)}</HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-1">
            <div className="font-medium">Total expenses — {label}</div>
            <div className="text-sm">Payroll {formatCurrency(data.expenses.payroll)}</div>
            <div className="text-sm">Contractors {formatCurrency(contractorsBase)}{spike > 0 ? ` + spike ${formatCurrency(spike)} (${formatPercent(contractorSpikePct)} of implementations)` : ''}</div>
            <div className="text-sm">Travel & Marketing {formatCurrency(data.expenses.travelMarketing)}</div>
            <div className="text-sm">License Fees {formatCurrency(data.expenses.licenseFees)}</div>
            <div className="text-sm">Shared Services {formatCurrency(data.expenses.sharedServices)}</div>
            <div className="text-sm">Legal {formatCurrency(data.expenses.legal)}</div>
            <div className="text-sm">Company Vehicle {formatCurrency(data.expenses.companyVehicle)}</div>
            <div className="text-sm">Insurance {formatCurrency(data.expenses.insurance)}</div>
            <div className="text-sm">Contingencies {formatCurrency(data.expenses.contingencies)}</div>
            <div className="text-sm">Consultant/Audit {formatCurrency(data.expenses.consultantAudit)}</div>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const NetIncomeHover = ({ label, value, revenue, expenses }) => (
    <HoverCard>
      <HoverCardTrigger className="cursor-help">{formatCurrencyCompact(value)}</HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-1">
          <div className="font-medium">Net income — {label}</div>
          <div className="text-sm">Total revenue {formatCurrency(revenue)} − Total expenses {formatCurrency(expenses)} = {formatCurrency(value)}</div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )

  const InvestmentHover = ({ label, amount, active }) => (
    <HoverCard>
      <HoverCardTrigger className="cursor-help">{formatCurrency(amount || 0)}</HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-1">
          <div className="font-medium">Investment — {label}</div>
          <div className="text-sm">{active ? `One-time inflow of ${formatCurrency(amount)} in ${label}` : `No investment this month (configured ${investmentMonth} for ${formatCurrency(investmentAmount)})`}</div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )

  const CashHover = ({ label, value, net, inflow }) => {
    const prev = value - net - (inflow || 0)
    return (
      <HoverCard>
        <HoverCardTrigger className="cursor-help font-bold">{value < 0 ? formatCurrencyCompact(value) : formatCurrency(value)}</HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-1">
            <div className="font-medium">Cash balance — {label}</div>
            <div className="text-sm">Previous balance {formatCurrency(prev)} + Net income {formatCurrency(net)} + Investment {formatCurrency(inflow || 0)} = {formatCurrency(value)}</div>
            <div className="text-xs text-muted-foreground">Initial cash as of {initialCashDate}: {formatCurrency(initialCash)}</div>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Income Statement</CardTitle>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <Tabs value={view} onValueChange={handleViewChange}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
                <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
              </TabsList>
            </Tabs>
           <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground">Cash balance as of</label>
                <div className="flex gap-2">
                  <input type="date" className="border rounded px-2 py-1 text-sm" value={initialCashDate} onChange={(e)=>setInitialCashDate(e.target.value)} />
                  <input type="number" className="border rounded px-2 py-1 text-sm w-32" value={initialCash} onChange={(e)=>setInitialCash(parseInt(e.target.value||'0',10))} />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-muted-foreground">Investment</label>
                <div className="flex gap-2">
                  <input type="month" className="border rounded px-2 py-1 text-sm" value={investmentMonth} onChange={(e)=>setInvestmentMonth(e.target.value)} />
                  <input type="number" className="border rounded px-2 py-1 text-sm w-32" value={investmentAmount} onChange={(e)=>setInvestmentAmount(parseInt(e.target.value||'0',10))} />
                </div>
              </div>
             <div className="flex items-center gap-2 ml-auto">
               <span className="text-xs text-muted-foreground">Edit income statement</span>
               <Switch checked={isEditing && view === 'monthly'} onCheckedChange={(v)=>{ setView('monthly'); setIsEditing(v) }} />
               {Object.keys(overrides).length > 0 && (
                 <Button variant="outline" size="sm" onClick={()=>setOverrides({})}>Clear overrides</Button>
               )}
             </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {view === 'expenses' ? (
              <div className="relative overflow-y-auto max-h-[60vh]">
                <Table container={false}>
                    <TableHeader>
                    <TableRow>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Month</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Payroll</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Contractors</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Travel & Marketing</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">License Fees</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Shared Services</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Legal</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Company Vehicle</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Insurance</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Contingencies</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Consultant/Audit</TableHead>
                      <TableHead className="text-center sticky top-0 z-10 bg-background">Total Expenses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">{data.period.label}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.payroll)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.contractors)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.travelMarketing)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.licenseFees)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.sharedServices)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.legal)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.companyVehicle)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.insurance)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.contingencies)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(data.expenses.consultantAudit)}</TableCell>
                        <TableCell className="text-center font-medium">{formatCurrency(data.totalExpenses)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {view === 'yearly' && (
                  <div className="mb-2 text-xs text-muted-foreground">Note: 2025 covers Aug–Dec only.</div>
                )}
                <div className="relative overflow-y-auto max-h-[60vh]">
                  <Table className="w-full" container={false}>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        <TableHead className="text-center sticky top-0 bg-background">{view === 'quarterly' ? 'Quarter' : (view === 'yearly' ? 'Year' : 'Month')}</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Subscription</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Transactional</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Implementation</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Maintenance</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Total Revenue</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Total Expenses</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Net Income</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Investment</TableHead>
                        <TableHead className="text-center sticky top-0 bg-background">Cash Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayData.map((data, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">{view === 'monthly' ? data.period.label : data.label}</TableCell>
                          <TableCell className="text-center">
                            {isEditing && view === 'monthly' ? (
                              <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" value={overrides[index]?.subscriptionRevenue ?? ''} placeholder={String(Math.round(data.subscriptionRevenue))} min="0" step="1000" onChange={(e)=>{
                                const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value||'0',10));
                                setOverrides((prev)=>({ ...prev, [index]: { ...(prev[index]||{}), subscriptionRevenue: val } }))
                              }} />
                            ) : (
                              view === 'monthly' ? (
                                <SubscriptionHover index={index} label={data.period.label} value={data.subscriptionRevenue} />
                              ) : (
                                formatCurrency(data.subscriptionRevenue)
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing && view === 'monthly' ? (
                              <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" value={overrides[index]?.transactionRevenue ?? ''} placeholder={String(Math.round(data.transactionRevenue))} min="0" step="1000" onChange={(e)=>{
                                const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value||'0',10));
                                setOverrides((prev)=>({ ...prev, [index]: { ...(prev[index]||{}), transactionRevenue: val } }))
                              }} />
                            ) : (
                              view === 'monthly' ? (
                                <TransactionalHover index={index} label={data.period.label} value={data.transactionRevenue} month0={data.period.month} />
                              ) : (
                                formatCurrency(data.transactionRevenue)
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing && view === 'monthly' ? (
                              <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" value={overrides[index]?.implementationRevenue ?? ''} placeholder={String(Math.round(data.implementationRevenue))} min="0" step="1000" onChange={(e)=>{
                                const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value||'0',10));
                                setOverrides((prev)=>({ ...prev, [index]: { ...(prev[index]||{}), implementationRevenue: val } }))
                              }} />
                            ) : (
                              view === 'monthly' ? (
                                <ImplementationHover index={index} label={data.period.label} value={data.implementationRevenue} />
                              ) : (
                                formatCurrency(data.implementationRevenue)
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing && view === 'monthly' ? (
                              <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" value={overrides[index]?.maintenanceRevenue ?? ''} placeholder={String(Math.round(data.maintenanceRevenue))} min="0" step="1000" onChange={(e)=>{
                                const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value||'0',10));
                                setOverrides((prev)=>({ ...prev, [index]: { ...(prev[index]||{}), maintenanceRevenue: val } }))
                              }} />
                            ) : (
                              view === 'monthly' ? (
                                <MaintenanceHover index={index} label={data.period.label} value={data.maintenanceRevenue} />
                              ) : (
                                formatCurrency(data.maintenanceRevenue)
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {view === 'monthly' ? (
                              <TotalRevenueHover
                                label={data.period.label}
                                value={data.totalRevenue}
                                components={{
                                  subscription: data.subscriptionRevenue,
                                  transactional: data.transactionRevenue,
                                  implementation: data.implementationRevenue,
                                  maintenance: data.maintenanceRevenue,
                                }}
                              />
                            ) : (
                              formatCurrency(data.totalRevenue)
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing && view === 'monthly' ? (
                              <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" value={overrides[index]?.totalExpenses ?? ''} placeholder={String(Math.round(data.totalExpenses))} min="0" step="1000" onChange={(e)=>{
                                const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value||'0',10));
                                setOverrides((prev)=>({ ...prev, [index]: { ...(prev[index]||{}), totalExpenses: val } }))
                              }} />
                            ) : (
                              view === 'monthly' ? (
                                <ExpensesHover label={data.period.label} data={data} index={index} />
                              ) : (
                                formatCurrency(data.totalExpenses)
                              )
                            )}
                          </TableCell>
                          <TableCell className={`text-center ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}> 
                            {view === 'monthly' ? (
                              <NetIncomeHover label={data.period.label} value={data.netIncome} revenue={data.totalRevenue} expenses={data.totalExpenses} />
                            ) : (
                              formatCurrencyCompact(data.netIncome)
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing && view === 'monthly' ? (
                              <input type="number" className="w-24 border rounded px-2 py-1 text-sm text-right" value={overrides[index]?.investmentInflow ?? ''} placeholder={String(Math.round(data.investmentInflow || 0))} min="0" step="1000" onChange={(e)=>{
                                const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value||'0',10));
                                setOverrides((prev)=>({ ...prev, [index]: { ...(prev[index]||{}), investmentInflow: val } }))
                              }} />
                            ) : (
                              view === 'monthly' ? (
                                <InvestmentHover label={data.period.label} amount={data.investmentInflow || 0} active={(data.investmentInflow || 0) > 0} />
                              ) : (
                                formatCurrency(data.investmentInflow || 0)
                              )
                            )}
                          </TableCell>
                          <TableCell className={`text-center ${data.cumulativeCashBalance >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}`}> 
                          {view === 'monthly' ? (
                              <CashHover label={data.period.label} value={data.cumulativeCashBalance} net={data.netIncome} inflow={data.investmentInflow} />
                            ) : (
                              data.cumulativeCashBalance < 0 ? formatCurrencyCompact(data.cumulativeCashBalance) : formatCurrency(data.cumulativeCashBalance)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default IncomeStatementTab