import { useState, useMemo, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    if (pace >= 10.5) return 0
    const clamped = Math.min(Math.max(pace, 0.5), 10)
    return Math.max(0.5, Math.min(8, ((10.5 - clamped) / 10) * 8))
  }

  const buildDefaultOnboardingRampPlan = (penetrationPercent, pace = 9, startIndex = 1) => {
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
    onboardingPlan: buildDefaultOnboardingRampPlan(15), // customers added per month (9x pace, start Sep 2025)
    
    // Expense assumptions (monthly $ amounts)
    expensePayroll: 110000,
    expenseContractors: 70000,
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
        investmentAmount: saved.investmentAmount ?? 1500000,
        investmentMonth: saved.investmentMonth ?? '2025-10'
      }
    } catch {
      return {
        initialCash: 675000,
        initialCashDate: '2025-07-31',
        investmentAmount: 1500000,
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">SHAED Finance Model</h1>
          <p className="text-xl text-muted-foreground">Dealer Market Opportunity Analysis</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Market Overview</TabsTrigger>
            <TabsTrigger value="opportunity">Revenue Opportunity</TabsTrigger>
            <TabsTrigger value="scenarios">Growth Scenarios</TabsTrigger>
            <TabsTrigger value="income">Income Statement</TabsTrigger>
            <TabsTrigger value="assumptions">Model Assumptions</TabsTrigger>
            <TabsTrigger value="kpi">Key Metrics</TabsTrigger>
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

          {/* Growth Scenarios Tab */}
          <TabsContent value="scenarios">
            <GrowthScenariosTab 
              penetrationScenarios={penetrationScenarios} 
              assumptions={assumptions}
              baseMarketData={baseMarketData}
              marketOpportunity={marketOpportunity}
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

          {/* Assumptions Tab */}
          <TabsContent value="assumptions">
            <AssumptionsTab 
              assumptions={assumptions} 
              updateAssumption={updateAssumption} 
              marketOpportunity={marketOpportunity} 
              baseMarketData={baseMarketData} 
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
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p>This dashboard provides estimates based on available market data and adjustable assumptions for investment analysis purposes.</p>
        </div>
      </div>
    </div>
  )
}

export default App