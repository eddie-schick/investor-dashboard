import { useState, useMemo, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { getMonthlyValue, computeActiveCustomersWithOnboarding } from '@/utils/ramping'
import {
  MarketOverviewTab,
  AssumptionsTab,
  RevenueOpportunityTab,
  GrowthScenariosTab,
  IncomeStatementTab
} from '@/components/dashboard'
import { KPITab } from '@/components/dashboard'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  // Market Data (Source: 2024 NADA/ATD Data)
  const baseMarketData = {
    totalDealerships: 3798,
    totalRevenue: 130.2e9, // $130.2B
    avgDealershipRevenue: 62.03e6, // $62.03M (ATD reported average)
    totalEmployment: 239345,
    avgEmployeesPerDealership: 63,
    totalTrucksSold: 507277,
    avgTruckPrice: 158993,
    totalTransactionValue: 80.65e9, // $80.65B
    
    // Software spending
    avgAnnualSoftwareSpend: 360000, // $360K per dealership
    totalSoftwareMarket: 1.37e9, // $1.37B
    
    // Department breakdown
    newTruckSales: 33.67e6, // 57.9% of revenue
    usedTruckSales: 3.57e6, // 6.1% of revenue
    servicePartsSales: 20.96e6, // 36.0% of revenue
    
    // Margins
    newTruckMargin: 0.075, // 7.5%
    usedTruckMargin: 0.079, // 7.9% (but losing money)
    servicePartsMargin: 0.382, // 38.2%
    
    // Current pain points
    usedTruckLossPerUnit: 3082, // Losing $3,082 per unit
    timeWastedSearching: 0.20, // 20% of time wasted
    avgAdvertisingSpend: 86167 // $86,167 per dealership
  }

  // Build default onboarding plan using the same ramp logic as the popout
  const mapPaceToExponent = (pace) => {
    if (pace >= 20.5) return 0
    const clamped = Math.min(Math.max(pace, 0.5), 20)
    if (clamped <= 10) {
      const inner = Math.min(Math.max(clamped, 0.5), 10)
      return Math.max(0.5, Math.min(8, ((10.5 - inner) / 10) * 8))
    }
    const fraction = (20.5 - clamped) / (20.5 - 10)
    return Math.max(0, 0.5 * fraction)
  }

  const buildDefaultOnboardingRampPlan = (penetrationPercent, pace = 10, startIndex = 1) => {
    const months = 29 // Aug-Dec 2025 (5) + 2026 (12) + 2027 (12)
    const totalDealers = baseMarketData.totalDealerships || 3816
    const targetDealers = Math.round(totalDealers * (penetrationPercent / 100))
    if (months <= 0 || targetDealers <= 0) return Array.from({ length: months }, () => 0)

    const effectiveStart = Math.min(Math.max(0, startIndex || 0), months - 1)
    const activeMonths = Math.max(1, months - effectiveStart)
    const exponent = mapPaceToExponent(pace)
    const weights = Array.from({ length: activeMonths }, (_, i) => Math.pow(i + 1, exponent))
    const sum = weights.reduce((s, w) => s + w, 0)
    let alloc = weights.map((w) => Math.round((w / sum) * targetDealers))
    let diff = targetDealers - alloc.reduce((s, v) => s + v, 0)
    let idx = activeMonths - 1
    while (diff !== 0 && activeMonths > 0) {
      const step = diff > 0 ? 1 : -1
      if (alloc[idx] + step >= 0) {
        alloc[idx] += step
        diff -= step
      }
      idx = (idx - 1 + activeMonths) % activeMonths
    }
    const plan = Array.from({ length: months }, () => 0)
    for (let i = 0; i < activeMonths; i++) plan[effectiveStart + i] = alloc[i]
    return plan
  }

  // Default implementation plan: 1 engagement in Jan 2026 and 1 in Jul 2026
  const buildDefaultImplementationPlan = () => {
    const months = 29 // Aug 2025..Dec 2027
    const plan = Array.from({ length: months }, () => 0)
    // Indices relative to Aug 2025
    // Jan 2026 index = 5, Jul 2026 index = 11
    plan[5] = 1
    plan[11] = 1
    return plan
  }

  // Adjustable assumptions
  const [assumptions, setAssumptions] = useState({
    // Revenue assumptions
    marketPenetration: 15, // 15% market share target
    transactionFeeRate: 0.5, // 0.5% transaction fee
    saasBasePricing: 999, // $999/month base SaaS price
    dealerWebsiteCost: 500, // $500/month per dealer website
    leadGenCostPerLead: 150, // $150 cost per lead
    customerAcquisitionCost: 5000, // $5K CAC
    customerLifetimeYears: 7, // 7 year customer lifetime
    annualChurnRate: 12, // 12% annual churn
    implementationPrice: 500000, // Price per implementation
    implementationPlan: buildDefaultImplementationPlan(), // monthly counts of implementations
    contractorsSpikePercentage: 0, // default 0% spike of implementation cost
    maintenancePercentage: 18, // 18% of implementation revenue
    maintenanceStartMonth: 3, // 3 months after implementation
    transactionsPerCustomer: 20, // Yearly transactions per customer
    avgTransactionPrice: 100000, // Average transaction price

    // Optional monthly overrides and ramps
    monthlyOverrides: {}, // { [assumptionKey]: number[] }
    ramps: {
      // Default 2% monthly increase for all expenses starting in Jun 2026 (index 10 from Aug 2025)
      expensePayroll: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseContractors: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseTravelMarketing: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseLicenseFees: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseSharedServices: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseLegal: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseCompanyVehicle: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseInsurance: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseContingencies: { enabled: true, monthlyPercent: 2, startMonth: 10 },
      expenseConsultantAudit: { enabled: true, monthlyPercent: 2, startMonth: 10 },
    },            // { [assumptionKey]: { enabled: boolean, monthlyPercent: number, startMonth?: number } }
    // Optional dealer onboarding plan
    useOnboardingPlan: true,
    onboardingPlan: buildDefaultOnboardingRampPlan(15), // customers added per month (10x pace, start Sep 2025)
    
    // Expense assumptions (monthly $ amounts)
    expensePayroll: 110000,
    expenseContractors: 50000,
    expenseTravelMarketing: 30000,
    expenseLicenseFees: 15000,
    expenseSharedServices: 18000,
    expenseLegal: 10000,
    expenseCompanyVehicle: 6000,
    expenseInsurance: 5000,
    expenseContingencies: 5000,
    expenseConsultantAudit: 2000
  })

  // Shared cash/investment settings across tabs (persisted)
  const [cashSettings, setCashSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cash.settings') || '{}')
      return {
        initialCash: saved.initialCash ?? 675000,
        initialCashDate: saved.initialCashDate ?? '2025-07-31',
        investmentAmount: saved.investmentAmount ?? 500000,
        investmentMonth: saved.investmentMonth ?? '2025-10'
      }
    } catch {
      return {
        initialCash: 675000,
        initialCashDate: '2025-07-31',
        investmentAmount: 500000,
        investmentMonth: '2025-10'
      }
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('cash.settings', JSON.stringify(cashSettings))
    } catch {}
  }, [cashSettings])

  const setInitialCash = (value) => setCashSettings((prev) => ({ ...prev, initialCash: value }))
  const setInitialCashDate = (value) => setCashSettings((prev) => ({ ...prev, initialCashDate: value }))
  const setInvestmentAmount = (value) => setCashSettings((prev) => ({ ...prev, investmentAmount: value }))
  const setInvestmentMonth = (value) => setCashSettings((prev) => ({ ...prev, investmentMonth: value }))

  // Update assumption function
  const updateAssumption = (key, value) => {
    setAssumptions(prev => ({ ...prev, [key]: value }))
  }

  // Calculate market opportunity based on assumptions
  const marketOpportunity = useMemo(() => {
    const targetDealerships = Math.round(baseMarketData.totalDealerships * (assumptions.marketPenetration / 100))
    // Assume 100% of penetrated dealerships are on the marketplace
    const marketplaceUsers = targetDealerships
    
    // SaaS Revenue
    const monthlySaasRevenue = targetDealerships * assumptions.saasBasePricing
    const annualSaasRevenue = monthlySaasRevenue * 12
    
    // Transaction Fee Revenue
    const avgTransactionValue = assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice
    const transactionsPerDealership = assumptions.transactionsPerCustomer || 168 // avg trucks sold per dealership
    const totalTransactions = marketplaceUsers * transactionsPerDealership
    const totalTransactionValue = totalTransactions * avgTransactionValue
    const transactionFeeRevenue = totalTransactionValue * (assumptions.transactionFeeRate / 100)
    
    // Website Revenue
    const websiteRevenue = targetDealerships * assumptions.dealerWebsiteCost * 12
    
    // Lead Generation Revenue
    const leadsPerDealership = 500 // estimated leads per dealership annually
    const totalLeads = targetDealerships * leadsPerDealership
    const leadGenRevenue = totalLeads * assumptions.leadGenCostPerLead
    
    // Implementation and Maintenance (annualized from first 12 months of plan)
    const monthsToAggregate = 12
    const implementationPrice = assumptions.implementationPrice || 500000
    const maintenancePercentage = assumptions.maintenancePercentage || 18
    const maintenanceStartMonth = assumptions.maintenanceStartMonth || 3
    let implementationAnnualRevenue = 0
    let maintenanceAnnualRevenue = 0
    for (let i = 0; i < monthsToAggregate; i++) {
      const count = assumptions.implementationPlan?.[i] ?? 0
      if (count > 0) {
        const rev = count * implementationPrice
        implementationAnnualRevenue += rev
        for (let m = i + maintenanceStartMonth; m < monthsToAggregate; m++) {
          maintenanceAnnualRevenue += (rev * (maintenancePercentage / 100)) / 12
        }
      }
    }

    // Total Revenue (annual)
    const totalRevenue = annualSaasRevenue + transactionFeeRevenue + websiteRevenue + leadGenRevenue + implementationAnnualRevenue + maintenanceAnnualRevenue
    
    // Customer metrics
    const customerLifetimeValue = (assumptions.saasBasePricing * 12 * assumptions.customerLifetimeYears) + 
                                (avgTransactionValue * transactionsPerDealership * (assumptions.transactionFeeRate / 100) * assumptions.customerLifetimeYears)
    const ltvcacRatio = customerLifetimeValue / assumptions.customerAcquisitionCost
    
    // Market size calculations
    const totalAddressableMarket = baseMarketData.totalSoftwareMarket + 
                                 (baseMarketData.totalTransactionValue * 0.02) + // 2% max transaction fee
                                  (baseMarketData.totalDealerships * 1000 * 12) + // $1K/month websites
                                  (baseMarketData.totalDealerships * 500 * 200) // Lead gen potential
    
    return {
      targetDealerships,
      marketplaceUsers,
      annualSaasRevenue,
      transactionFeeRevenue,
      websiteRevenue,
      leadGenRevenue,
      implementationAnnualRevenue,
      maintenanceAnnualRevenue,
      totalRevenue,
      customerLifetimeValue,
      ltvcacRatio,
      totalAddressableMarket,
      totalTransactions,
      totalTransactionValue
    }
  }, [assumptions, baseMarketData])

  // Penetration scenarios — compute revenue from assumptions (SaaS + Websites + Transaction fees)
  const revenueAtPct = (pct) => {
    const dealers = Math.round(baseMarketData.totalDealerships * (pct / 100))
    const saasAnnual = dealers * (assumptions.saasBasePricing || 0) * 12
    const websiteAnnual = dealers * (assumptions.dealerWebsiteCost || 0) * 12
    const tpcYear = assumptions.transactionsPerCustomer || 0
    const avgPrice = assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice
    const feeRate = (assumptions.transactionFeeRate || 0) / 100
    const transactional = dealers * tpcYear * avgPrice * feeRate
    const total = saasAnnual + websiteAnnual + transactional
    return Math.round(total / 1e6) // value in Millions for the chart
  }
  const penetrationScenarios = [
    { penetration: '5%', dealerships: Math.round(baseMarketData.totalDealerships * 0.05), revenue: revenueAtPct(5) },
    { penetration: '10%', dealerships: Math.round(baseMarketData.totalDealerships * 0.10), revenue: revenueAtPct(10) },
    { penetration: '15%', dealerships: Math.round(baseMarketData.totalDealerships * 0.15), revenue: revenueAtPct(15) },
    { penetration: '25%', dealerships: Math.round(baseMarketData.totalDealerships * 0.25), revenue: revenueAtPct(25) },
    { penetration: '35%', dealerships: Math.round(baseMarketData.totalDealerships * 0.35), revenue: revenueAtPct(35) }
  ]

  const exportToExcel = async () => {
    try {
      // Dynamically import SheetJS from CDN to avoid local install issues
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs')
      const wb = XLSX.utils.book_new()

      // Helper: months timeline (Aug 2025 – Dec 2027)
      const months = (() => {
        const result = []
        const startMonth = 7
        const startYear = 2025
        const endMonth = 11
        const endYear = 2027
        for (let year = startYear; year <= endYear; year++) {
          const mStart = year === startYear ? startMonth : 0
          const mEnd = year === endYear ? endMonth : 11
          for (let m = mStart; m <= mEnd; m++) {
            result.push({
              month: m,
              year,
              key: `${year}-${String(m + 1).padStart(2, '0')}`,
              label: new Date(year, m, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            })
          }
        }
        return result
      })()

      // Sheet: Base Market Data
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          Object.entries(baseMarketData).map(([k, v]) => ({ key: k, value: v }))
        ),
        'MarketData'
      )

      // Sheet: Cash Settings
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          Object.entries(cashSettings).map(([k, v]) => ({ key: k, value: v }))
        ),
        'CashSettings'
      )

      // Sheet: Assumptions (base fields)
      const excludeKeys = new Set(['implementationPlan', 'onboardingPlan', 'ramps', 'monthlyOverrides'])
      const assumptionsBaseRows = Object.entries(assumptions)
        .filter(([k, v]) => !excludeKeys.has(k) && (typeof v !== 'object' || v === null))
        .map(([k, v]) => ({ key: k, value: v }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assumptionsBaseRows), 'Assumptions_Base')

      // Sheet: Implementation Plan
      const implRows = months.map((m, idx) => ({ index: idx, month: m.label, implementations: assumptions.implementationPlan?.[idx] ?? 0 }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(implRows), 'ImplementationPlan')

      // Sheet: Onboarding Plan
      const onboardRows = months.map((m, idx) => ({ index: idx, month: m.label, onboardAdds: assumptions.onboardingPlan?.[idx] ?? 0 }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(onboardRows), 'OnboardingPlan')

      // Sheet: Ramps
      const ramps = assumptions.ramps || {}
      const rampsRows = Object.keys(ramps).map((k) => ({ key: k, enabled: !!ramps[k]?.enabled, monthlyPercent: ramps[k]?.monthlyPercent ?? null, startMonth: ramps[k]?.startMonth ?? null }))
      if (rampsRows.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rampsRows), 'Assumptions_Ramps')
      }

      // Sheet: Monthly Overrides (flattened)
      const overrides = assumptions.monthlyOverrides || {}
      const overrideRows = []
      Object.keys(overrides).forEach((assumptionKey) => {
        const arr = overrides[assumptionKey] || []
        arr.forEach((val, idx) => {
          if (typeof val === 'number') {
            overrideRows.push({ key: assumptionKey, index: idx, month: months[idx]?.label ?? idx, value: val })
          }
        })
      })
      if (overrideRows.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overrideRows), 'Assumptions_Overrides')
      }

      // Sheet: Market Opportunity (computed)
      const moRows = Object.entries(marketOpportunity).map(([k, v]) => ({ key: k, value: v }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(moRows), 'MarketOpportunity')

      // Sheet: Penetration Scenarios
      const penRows = penetrationScenarios.map((s) => ({ penetration: s.penetration, dealerships: s.dealerships, revenueMillions: s.revenue, revenueDollars: Math.round((s.revenue || 0) * 1e6) }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(penRows), 'PenetrationScenarios')

      // Revenue Opportunity: annualized implementations and maintenance (first 12 months)
      const monthsToAggregate = 12
      let annualImplementation = 0
      let annualMaintenance = 0
      const maintenancePercentage = assumptions.maintenancePercentage || 18
      const maintenanceStartMonth = assumptions.maintenanceStartMonth || 3
      const pricePerImplementation = assumptions.implementationPrice || 500000
      for (let i = 0; i < monthsToAggregate; i++) {
        const count = assumptions.implementationPlan?.[i] ?? 0
        if (count > 0) {
          const revenueThisMonth = count * pricePerImplementation
          annualImplementation += revenueThisMonth
          for (let m = i + maintenanceStartMonth; m < monthsToAggregate; m++) {
            annualMaintenance += (revenueThisMonth * (maintenancePercentage / 100)) / 12
          }
        }
      }
      const annualized = {
        saas: marketOpportunity.annualSaasRevenue || 0,
        websites: marketOpportunity.websiteRevenue || 0,
        subscription: (marketOpportunity.annualSaasRevenue || 0) + (marketOpportunity.websiteRevenue || 0),
        transactions: marketOpportunity.transactionFeeRevenue || 0,
        implementations: annualImplementation,
        maintenance: annualMaintenance,
        total: ((marketOpportunity.annualSaasRevenue || 0) + (marketOpportunity.websiteRevenue || 0)) + (marketOpportunity.transactionFeeRevenue || 0) + annualImplementation + annualMaintenance
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([annualized]), 'Revenue_Annualized')

      // Income Statement: monthly computation (base, without UI overrides)
      const seasonal = [0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.1]
      let cumulativeCash = cashSettings.initialCash || 0
      const implementationProjects = []
      const incomeMonthly = months.map((period, index) => {
        // Implementation revenue & project tracking
        let implementationRevenue = 0
        const countThisMonth = (assumptions.implementationPlan?.[index] ?? 0)
        if (countThisMonth > 0) {
          implementationRevenue = countThisMonth * (assumptions.implementationPrice || 500000)
          implementationProjects.push({ startMonth: index, revenue: implementationRevenue })
        }

        // Customers with onboarding plan
        const monthsSinceStart = index
        const onboardingCustomers = computeActiveCustomersWithOnboarding(assumptions, index, baseMarketData.totalDealerships || 3816)
        let customers
        if (typeof onboardingCustomers === 'number') {
          customers = onboardingCustomers
        } else {
          const growthMultiplier = 1 + (monthsSinceStart * 0.015)
          const baseCustomers = Math.floor((assumptions.marketPenetration / 100) * (baseMarketData.totalDealerships || 3816) * growthMultiplier)
          const monthlyChurnRate = (assumptions.annualChurnRate / 100) / 12
          const retentionRate = Math.pow(1 - monthlyChurnRate, monthsSinceStart)
          customers = Math.floor(baseCustomers * retentionRate)
        }

        // Subscription revenue
        const saasPrice = getMonthlyValue(assumptions, 'saasBasePricing', index) || 0
        const websitePrice = getMonthlyValue(assumptions, 'dealerWebsiteCost', index) || 0
        const subscriptionRevenue = customers * (saasPrice + websitePrice)

        // Transactional
        const seasonalFactor = seasonal[period.month]
        const avgTruckPrice = getMonthlyValue(assumptions, 'avgTransactionPrice', index) || baseMarketData.avgTruckPrice || 158993
        const tpcYear = getMonthlyValue(assumptions, 'transactionsPerCustomer', index) || 168
        const feeRate = getMonthlyValue(assumptions, 'transactionFeeRate', index) || 0
        const transactionsPerCustomer = (tpcYear / 12) * seasonalFactor
        const transactionRevenue = customers * transactionsPerCustomer * avgTruckPrice * (feeRate / 100)
        const transactionsCount = customers * transactionsPerCustomer

        // Maintenance revenue from past implementations
        let maintenanceRevenue = 0
        const maintPct = getMonthlyValue(assumptions, 'maintenancePercentage', index) || 18
        const maintStart = Math.round(getMonthlyValue(assumptions, 'maintenanceStartMonth', index) || 3)
        implementationProjects.forEach((p) => {
          const monthsSinceImpl = index - p.startMonth
          if (monthsSinceImpl >= maintStart) maintenanceRevenue += (p.revenue * (maintPct / 100)) / 12
        })

        const totalRevenue = subscriptionRevenue + transactionRevenue + implementationRevenue + maintenanceRevenue

        // Expenses
        const expensePayroll = getMonthlyValue(assumptions, 'expensePayroll', index) || 110000
        const expenseContractorsBase = getMonthlyValue(assumptions, 'expenseContractors', index) || 50000
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
        const totalExpenses = expensePayroll + (expenseContractorsBase + contractorSpike) + expenseTravelMarketing + expenseLicenseFees + expenseSharedServices + expenseLegal + expenseCompanyVehicle + expenseInsurance + expenseContingencies + expenseConsultantAudit

        const netIncome = totalRevenue - totalExpenses
        const investmentInflow = (period.key === cashSettings.investmentMonth) ? (cashSettings.investmentAmount || 0) : 0
        cumulativeCash += netIncome + investmentInflow

        return {
          key: period.key,
          period: period.label,
          customers,
          subscriptionRevenue,
          transactionRevenue,
          implementationRevenue,
          maintenanceRevenue,
          totalRevenue,
          expensePayroll,
          expenseContractors: expenseContractorsBase + contractorSpike,
          expenseTravelMarketing,
          expenseLicenseFees,
          expenseSharedServices,
          expenseLegal,
          expenseCompanyVehicle,
          expenseInsurance,
          expenseContingencies,
          expenseConsultantAudit,
          totalExpenses,
          netIncome,
          investmentInflow,
          cumulativeCashBalance: cumulativeCash,
          transactionsCount
        }
      })

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeMonthly), 'Income_Monthly')

      // Income: Quarterly aggregation (every 3 months in order)
      const incomeQuarterly = []
      for (let i = 0; i < incomeMonthly.length; i += 3) {
        const group = incomeMonthly.slice(i, i + 3)
        if (group.length === 0) continue
        const first = group[0]
        const [yStr, mStr] = first.key.split('-')
        const m0 = parseInt(mStr, 10) - 1
        const quarterNum = Math.floor(m0 / 3) + 1
        incomeQuarterly.push({
          quarter: `Q${quarterNum} ${yStr}`,
          customersAvg: Math.round(group.reduce((s, r) => s + r.customers, 0) / group.length),
          subscriptionRevenue: group.reduce((s, r) => s + r.subscriptionRevenue, 0),
          transactionRevenue: group.reduce((s, r) => s + r.transactionRevenue, 0),
          implementationRevenue: group.reduce((s, r) => s + r.implementationRevenue, 0),
          maintenanceRevenue: group.reduce((s, r) => s + r.maintenanceRevenue, 0),
          totalRevenue: group.reduce((s, r) => s + r.totalRevenue, 0),
          totalExpenses: group.reduce((s, r) => s + r.totalExpenses, 0),
          netIncome: group.reduce((s, r) => s + r.netIncome, 0),
          investmentInflow: group.reduce((s, r) => s + r.investmentInflow, 0),
          cumulativeCashBalance: group[group.length - 1].cumulativeCashBalance,
          transactionsCount: group.reduce((s, r) => s + r.transactionsCount, 0)
        })
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeQuarterly), 'Income_Quarterly')

      // Income: Yearly aggregation
      const yearMap = {}
      incomeMonthly.forEach((r) => {
        const year = r.key.split('-')[0]
        if (!yearMap[year]) {
          yearMap[year] = {
            year,
            customersSum: 0,
            months: 0,
            subscriptionRevenue: 0,
            transactionRevenue: 0,
            implementationRevenue: 0,
            maintenanceRevenue: 0,
            totalRevenue: 0,
            totalExpenses: 0,
            netIncome: 0,
            investmentInflow: 0,
            cumulativeCashBalance: 0,
            transactionsCount: 0
          }
        }
        const y = yearMap[year]
        y.customersSum += r.customers
        y.months += 1
        y.subscriptionRevenue += r.subscriptionRevenue
        y.transactionRevenue += r.transactionRevenue
        y.implementationRevenue += r.implementationRevenue
        y.maintenanceRevenue += r.maintenanceRevenue
        y.totalRevenue += r.totalRevenue
        y.totalExpenses += r.totalExpenses
        y.netIncome += r.netIncome
        y.investmentInflow += r.investmentInflow
        y.cumulativeCashBalance = r.cumulativeCashBalance
        y.transactionsCount += r.transactionsCount
      })
      const incomeYearly = Object.values(yearMap).map((y) => ({
        year: y.year,
        customersAvg: Math.round(y.customersSum / Math.max(1, y.months)),
        subscriptionRevenue: y.subscriptionRevenue,
        transactionRevenue: y.transactionRevenue,
        implementationRevenue: y.implementationRevenue,
        maintenanceRevenue: y.maintenanceRevenue,
        totalRevenue: y.totalRevenue,
        totalExpenses: y.totalExpenses,
        netIncome: y.netIncome,
        investmentInflow: y.investmentInflow,
        cumulativeCashBalance: y.cumulativeCashBalance,
        transactionsCount: y.transactionsCount
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeYearly), 'Income_Yearly')

      // KPI: Cash balance series (duplicate of chart data)
      const cashSeries = incomeMonthly.map((r) => ({ period: r.period, cashBalance: r.cumulativeCashBalance }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cashSeries), 'KPI_CashBalance')

      // Growth scenario detail ranges (5-10, 15-20, 25-35)
      const totalDealerships = baseMarketData.totalDealerships || 3816
      const calcAnnual = (dealers) => {
        const saasAnnual = dealers * (assumptions.saasBasePricing || 0) * 12
        const websiteAnnual = dealers * (assumptions.dealerWebsiteCost || 0) * 12
        const tpcYear = assumptions.transactionsPerCustomer || 0
        const avgPrice = assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice || 0
        const feeRate = (assumptions.transactionFeeRate || 0) / 100
        const transactional = dealers * tpcYear * avgPrice * feeRate
        return saasAnnual + websiteAnnual + transactional
      }
      const makeRange = (minPct, maxPct) => {
        const minDealers = Math.round(totalDealerships * (minPct / 100))
        const maxDealers = Math.round(totalDealerships * (maxPct / 100))
        const cac = assumptions.customerAcquisitionCost || 0
        return {
          range: `${minPct}-${maxPct}%`,
          minDealers,
          maxDealers,
          annualRevenueMin: calcAnnual(minDealers),
          annualRevenueMax: calcAnnual(maxDealers),
          investMin: cac * minDealers,
          investMax: cac * maxDealers
        }
      }
      const scenarioRows = [makeRange(5, 10), makeRange(15, 20), makeRange(25, 35)]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scenarioRows), 'Growth_Scenarios')

      // Finalize download
      XLSX.writeFile(wb, 'SHAED_Finance_Model_Export.xlsx')
    } catch (err) {
      console.error('Export failed', err)
      alert('Export failed. See console for details.')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">SHAED Finance Model</h1>
          <p className="text-xl text-muted-foreground">Dealer Market Opportunity Analysis</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Market Overview</TabsTrigger>
            <TabsTrigger value="opportunity">Revenue Opportunity</TabsTrigger>
            <TabsTrigger value="income">Income Statement</TabsTrigger>
            <TabsTrigger value="kpi">Key Metrics</TabsTrigger>
            <TabsTrigger value="assumptions">Model Assumptions</TabsTrigger>
            <TabsTrigger value="scenarios">Growth Scenarios</TabsTrigger>
          </TabsList>

          {/* Market Overview Tab */}
          <TabsContent value="overview">
            <MarketOverviewTab baseMarketData={baseMarketData} marketOpportunity={marketOpportunity} />
          </TabsContent>

          {/* Revenue Opportunity Tab */}
          <TabsContent value="opportunity">
            <RevenueOpportunityTab 
              marketOpportunity={marketOpportunity} 
              assumptions={assumptions} 
              penetrationScenarios={penetrationScenarios}
              baseMarketData={baseMarketData} 
            />
          </TabsContent>

          {/* Income Statement Tab */}
          <TabsContent value="income">
            <IncomeStatementTab 
              assumptions={assumptions}
              initialCash={cashSettings.initialCash}
              setInitialCash={setInitialCash}
              initialCashDate={cashSettings.initialCashDate}
              setInitialCashDate={setInitialCashDate}
              investmentAmount={cashSettings.investmentAmount}
              setInvestmentAmount={setInvestmentAmount}
              investmentMonth={cashSettings.investmentMonth}
              setInvestmentMonth={setInvestmentMonth}
            />
          </TabsContent>

          {/* Key Metrics Tab */}
          <TabsContent value="kpi">
            <KPITab 
              assumptions={assumptions}
              marketOpportunity={marketOpportunity}
              baseMarketData={baseMarketData}
              initialCash={cashSettings.initialCash}
              investmentAmount={cashSettings.investmentAmount}
              investmentMonth={cashSettings.investmentMonth}
            />
          </TabsContent>

          {/* Assumptions Tab */}
          <TabsContent value="assumptions">
            <AssumptionsTab 
              assumptions={assumptions} 
              updateAssumption={updateAssumption} 
              marketOpportunity={marketOpportunity} 
              baseMarketData={baseMarketData} 
            />
          </TabsContent>

          {/* Growth Scenarios Tab */}
          <TabsContent value="scenarios">
            <GrowthScenariosTab 
              penetrationScenarios={penetrationScenarios} 
              assumptions={assumptions}
              baseMarketData={baseMarketData}
              marketOpportunity={marketOpportunity}
            />
          </TabsContent>
        </Tabs>

        {/* Footer (hidden on Market Overview tab) */}
        {activeTab !== 'overview' && (
          <div className="border-t pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
              <p>This dashboard provides estimates based on available market data and adjustable assumptions for investment analysis purposes.</p>
              <Button onClick={exportToExcel} size="sm">Export to Excel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App