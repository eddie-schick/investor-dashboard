import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, DollarSign, Users } from 'lucide-react'
import {
  MarketOverviewTab,
  AssumptionsTab,
  RevenueOpportunityTab,
  GrowthScenariosTab,
  IncomeStatementTab
} from '@/components/dashboard'
import { KPITab } from '@/components/dashboard'
import { formatCurrency } from '@/utils/formatters'
import './App.css'

function App() {
  // Market Data (Source: 2023 ATD Data)
  const baseMarketData = {
    totalDealerships: 3816,
    totalRevenue: 224.65e9, // $224.65B
    avgDealershipRevenue: 58.87e6, // $58.87M
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
    usedTruckLossPerUnit: 3288, // Losing $3,288 per unit
    timeWastedSearching: 0.20, // 20% of time wasted
    avgAdvertisingSpend: 86167 // $86,167 per dealership
  }

  // Build default onboarding plan (Aug 2025 - Dec 2027 inclusive) - EVEN distribution adjusted for churn
  const computeDefaultOnboardingPlan = (penetrationPercent) => {
    const months = 29 // Aug-Dec 2025 (5) + 2026 (12) + 2027 (12)
    const totalDealers = baseMarketData.totalDealerships || 3816
    const targetDealers = Math.round(totalDealers * (penetrationPercent / 100))
    if (months <= 0 || targetDealers <= 0) return Array.from({ length: months }, () => 0)
    const annualChurnRate = 12 // default aligned with initial state
    const monthlyChurnRate = (annualChurnRate / 100) / 12
    const survival = (steps) => Math.pow(1 - monthlyChurnRate, steps)

    // Even distribution weights
    const weights = Array.from({ length: months }, () => 1)
    const effectiveWeights = weights.map((w, i) => w * survival(months - 1 - i))
    const effSum = effectiveWeights.reduce((s, x) => s + x, 0)
    const factor = effSum > 0 ? targetDealers / effSum : 0
    let plan = weights.map((w) => Math.floor(w * factor))

    const simulateEndActive = (adds) => {
      let active = 0
      for (let i = 0; i < months; i++) {
        active = Math.floor(active * (1 - monthlyChurnRate)) + (adds[i] || 0)
      }
      return active
    }
    let endActive = simulateEndActive(plan)
    let diff = targetDealers - endActive
    if (diff !== 0) plan[months - 1] = Math.max(0, plan[months - 1] + diff)
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
    customerAcquisitionCost: 15000, // $15K CAC
    customerLifetimeYears: 7, // 7 year customer lifetime
    annualChurnRate: 12, // 12% annual churn
    implementationPrice: 500000, // Price per implementation
    implementationPlan: [], // monthly counts of implementations (default 0)
    contractorsSpikePercentage: 40, // 40% of implementation cost
    maintenancePercentage: 18, // 18% of implementation revenue
    maintenanceStartMonth: 3, // 3 months after implementation
    transactionsPerCustomer: 20, // Yearly transactions per customer
    avgTransactionPrice: 100000, // Average transaction price

    // Optional monthly overrides and ramps
    monthlyOverrides: {}, // { [assumptionKey]: number[] }
    ramps: {},            // { [assumptionKey]: { enabled: boolean, monthlyPercent: number } }
    // Optional dealer onboarding plan
    useOnboardingPlan: true,
    onboardingPlan: computeDefaultOnboardingPlan(15), // customers added per month
    
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

  // Penetration scenarios
  const penetrationScenarios = [
    { penetration: '5%', dealerships: Math.round(baseMarketData.totalDealerships * 0.05), revenue: Math.round((marketOpportunity.totalRevenue * 0.05 / assumptions.marketPenetration) / 1e6) },
    { penetration: '10%', dealerships: Math.round(baseMarketData.totalDealerships * 0.10), revenue: Math.round((marketOpportunity.totalRevenue * 0.10 / assumptions.marketPenetration) / 1e6) },
    { penetration: '15%', dealerships: Math.round(baseMarketData.totalDealerships * 0.15), revenue: Math.round((marketOpportunity.totalRevenue * 0.15 / assumptions.marketPenetration) / 1e6) },
    { penetration: '25%', dealerships: Math.round(baseMarketData.totalDealerships * 0.25), revenue: Math.round((marketOpportunity.totalRevenue * 0.25 / assumptions.marketPenetration) / 1e6) },
    { penetration: '35%', dealerships: Math.round(baseMarketData.totalDealerships * 0.35), revenue: Math.round((marketOpportunity.totalRevenue * 0.35 / assumptions.marketPenetration) / 1e6) }
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Commercial Truck Dealership Market</h1>
          <p className="text-xl text-muted-foreground">Interactive Investor Dashboard - Market Opportunity Analysis</p>
          <div className="flex justify-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              <Building2 className="w-4 h-4 mr-1" />
              {baseMarketData.totalDealerships.toLocaleString()} Dealerships
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <DollarSign className="w-4 h-4 mr-1" />
              {formatCurrency(baseMarketData.totalRevenue)} Industry Revenue
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {baseMarketData.totalEmployment.toLocaleString()} Employees
            </Badge>
          </div>
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
            <GrowthScenariosTab penetrationScenarios={penetrationScenarios} />
          </TabsContent>
          
          {/* Income Statement Tab */}
          <TabsContent value="income">
            <IncomeStatementTab assumptions={assumptions} />
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
            <KPITab assumptions={assumptions} marketOpportunity={marketOpportunity} baseMarketData={baseMarketData} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p>Data Sources: 2023 ATD (American Truck Dealers) Report, Industry Research, Market Analysis</p>
          <p>This dashboard provides estimates based on available market data and adjustable assumptions for investment analysis purposes.</p>
        </div>
      </div>
    </div>
  )
}

export default App