import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { TrendingUp, DollarSign, Users, Building2, Truck, Wrench, ShoppingCart, Globe, Calculator, Target, Zap, AlertTriangle } from 'lucide-react'
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

  // Adjustable assumptions
  const [assumptions, setAssumptions] = useState({
    marketPenetration: 15, // 15% market share target
    transactionFeeRate: 0.75, // 0.75% transaction fee
    saasBasePricing: 999, // $999/month base SaaS price
    marketplaceAdoptionRate: 60, // 60% of customers use marketplace
    dealerWebsiteCost: 500, // $500/month per dealer website
    leadGenCostPerLead: 150, // $150 cost per lead
    conversionRate: 12, // 12% lead to sale conversion
    customerAcquisitionCost: 15000, // $15K CAC
    customerLifetimeYears: 7, // 7 year customer lifetime
    annualChurnRate: 12, // 12% annual churn
    marketGrowthRate: 5, // 5% annual market growth
    competitorResponse: 25 // 25% competitive pressure discount
  })

  // Update assumption function
  const updateAssumption = (key, value) => {
    setAssumptions(prev => ({ ...prev, [key]: value }))
  }

  // Calculate market opportunity based on assumptions
  const marketOpportunity = useMemo(() => {
    const targetDealerships = Math.round(baseMarketData.totalDealerships * (assumptions.marketPenetration / 100))
    const marketplaceUsers = Math.round(targetDealerships * (assumptions.marketplaceAdoptionRate / 100))
    
    // SaaS Revenue
    const monthlySaasRevenue = targetDealerships * assumptions.saasBasePricing
    const annualSaasRevenue = monthlySaasRevenue * 12
    
    // Transaction Fee Revenue
    const avgTransactionValue = baseMarketData.avgTruckPrice
    const transactionsPerDealership = 168 // avg trucks sold per dealership
    const totalTransactions = marketplaceUsers * transactionsPerDealership
    const totalTransactionValue = totalTransactions * avgTransactionValue
    const transactionFeeRevenue = totalTransactionValue * (assumptions.transactionFeeRate / 100)
    
    // Website Revenue
    const websiteRevenue = targetDealerships * assumptions.dealerWebsiteCost * 12
    
    // Lead Generation Revenue
    const leadsPerDealership = 500 // estimated leads per dealership annually
    const totalLeads = targetDealerships * leadsPerDealership
    const leadGenRevenue = totalLeads * assumptions.leadGenCostPerLead
    
    // Total Revenue
    const totalRevenue = annualSaasRevenue + transactionFeeRevenue + websiteRevenue + leadGenRevenue
    
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
      totalRevenue,
      customerLifetimeValue,
      ltvcacRatio,
      totalAddressableMarket,
      totalTransactions,
      totalTransactionValue
    }
  }, [assumptions, baseMarketData])

  // Chart data
  const revenueBreakdown = [
    { name: 'SaaS Subscriptions', value: marketOpportunity.annualSaasRevenue, color: '#8884d8' },
    { name: 'Transaction Fees', value: marketOpportunity.transactionFeeRevenue, color: '#82ca9d' },
    { name: 'Dealer Websites', value: marketOpportunity.websiteRevenue, color: '#ffc658' },
    { name: 'Lead Generation', value: marketOpportunity.leadGenRevenue, color: '#ff7300' }
  ]

  const marketSizeComparison = [
    { category: 'Current Software Market', value: baseMarketData.totalSoftwareMarket / 1e9, source: '2023 ATD Data' },
    { category: 'Transaction Opportunity', value: (baseMarketData.totalTransactionValue * 0.015) / 1e9, source: '1.5% fee estimate' },
    { category: 'Website Market', value: (baseMarketData.totalDealerships * 1000 * 12) / 1e9, source: '$1K/month estimate' },
    { category: 'Lead Gen Market', value: (baseMarketData.totalDealerships * 500 * 200) / 1e9, source: '500 leads × $200' },
    { category: 'Total Addressable', value: marketOpportunity.totalAddressableMarket / 1e9, source: 'Combined markets' }
  ]

  const penetrationScenarios = [
    { penetration: '5%', dealerships: Math.round(baseMarketData.totalDealerships * 0.05), revenue: Math.round((marketOpportunity.totalRevenue * 0.05 / assumptions.marketPenetration) / 1e6) },
    { penetration: '10%', dealerships: Math.round(baseMarketData.totalDealerships * 0.10), revenue: Math.round((marketOpportunity.totalRevenue * 0.10 / assumptions.marketPenetration) / 1e6) },
    { penetration: '15%', dealerships: Math.round(baseMarketData.totalDealerships * 0.15), revenue: Math.round((marketOpportunity.totalRevenue * 0.15 / assumptions.marketPenetration) / 1e6) },
    { penetration: '25%', dealerships: Math.round(baseMarketData.totalDealerships * 0.25), revenue: Math.round((marketOpportunity.totalRevenue * 0.25 / assumptions.marketPenetration) / 1e6) },
    { penetration: '35%', dealerships: Math.round(baseMarketData.totalDealerships * 0.35), revenue: Math.round((marketOpportunity.totalRevenue * 0.35 / assumptions.marketPenetration) / 1e6) }
  ]

  const formatCurrency = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const formatNumber = (value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`
    return value.toLocaleString()
  }

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Market Overview</TabsTrigger>
            <TabsTrigger value="assumptions">Adjust Assumptions</TabsTrigger>
            <TabsTrigger value="opportunity">Revenue Opportunity</TabsTrigger>
            <TabsTrigger value="scenarios">Growth Scenarios</TabsTrigger>
          </TabsList>

          {/* Market Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Market Size</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(marketOpportunity.totalAddressableMarket)}</div>
                  <p className="text-xs text-muted-foreground">Total Addressable Market</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Software Spending</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(baseMarketData.totalSoftwareMarket)}</div>
                  <p className="text-xs text-muted-foreground">Annual software market</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(baseMarketData.totalTransactionValue)}</div>
                  <p className="text-xs text-muted-foreground">Annual truck sales value</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Dealership</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(baseMarketData.avgDealershipRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Annual revenue per dealership</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Size Breakdown</CardTitle>
                  <CardDescription>Total addressable market by category (Source: 2023 ATD Data)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={marketSizeComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toFixed(1)}B`, 'Market Size']} />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Revenue Mix</CardTitle>
                  <CardDescription>Average dealership revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'New Trucks', value: baseMarketData.newTruckSales, color: '#8884d8' },
                          { name: 'Service & Parts', value: baseMarketData.servicePartsSales, color: '#82ca9d' },
                          { name: 'Used Trucks', value: baseMarketData.usedTruckSales, color: '#ffc658' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'New Trucks', value: baseMarketData.newTruckSales, color: '#8884d8' },
                          { name: 'Service & Parts', value: baseMarketData.servicePartsSales, color: '#82ca9d' },
                          { name: 'Used Trucks', value: baseMarketData.usedTruckSales, color: '#ffc658' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Market Insights</CardTitle>
                <CardDescription>Critical opportunities and pain points (Source: 2023 ATD Data & Industry Research)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h4 className="font-semibold">Used Truck Losses</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Dealerships lose ${baseMarketData.usedTruckLossPerUnit.toLocaleString()} per used truck sale</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(baseMarketData.usedTruckLossPerUnit * 44 * baseMarketData.totalDealerships)} annual industry loss</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <h4 className="font-semibold">Time Inefficiency</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">20% of employee time wasted searching for information</p>
                    <p className="text-lg font-bold text-yellow-600">{formatCurrency(baseMarketData.totalEmployment * 69400 * 0.20)} annual productivity loss</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-5 w-5 text-green-500" />
                      <h4 className="font-semibold">Service Margins</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Service & parts: 38.2% gross margin (highest profitability)</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(baseMarketData.servicePartsSales * baseMarketData.servicePartsMargin * baseMarketData.totalDealerships)} annual gross profit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assumptions Tab */}
          <TabsContent value="assumptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adjust Market Assumptions</CardTitle>
                <CardDescription>Modify these assumptions to see how they impact the market opportunity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="marketPenetration">Market Penetration (%)</Label>
                    <Slider
                      id="marketPenetration"
                      min={1}
                      max={50}
                      step={1}
                      value={[assumptions.marketPenetration]}
                      onValueChange={(value) => updateAssumption('marketPenetration', value[0])}
                    />
                    <div className="text-sm text-muted-foreground">{assumptions.marketPenetration}% = {Math.round(baseMarketData.totalDealerships * assumptions.marketPenetration / 100).toLocaleString()} dealerships</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transactionFeeRate">Transaction Fee Rate (%)</Label>
                    <Slider
                      id="transactionFeeRate"
                      min={0.1}
                      max={3.0}
                      step={0.1}
                      value={[assumptions.transactionFeeRate]}
                      onValueChange={(value) => updateAssumption('transactionFeeRate', value[0])}
                    />
                    <div className="text-sm text-muted-foreground">{assumptions.transactionFeeRate}% per transaction</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saasBasePricing">SaaS Base Price ($/month)</Label>
                    <Input
                      id="saasBasePricing"
                      type="number"
                      value={assumptions.saasBasePricing}
                      onChange={(e) => updateAssumption('saasBasePricing', parseInt(e.target.value) || 0)}
                    />
                    <div className="text-sm text-muted-foreground">${(assumptions.saasBasePricing * 12).toLocaleString()} annually per customer</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marketplaceAdoptionRate">Marketplace Adoption (%)</Label>
                    <Slider
                      id="marketplaceAdoptionRate"
                      min={10}
                      max={100}
                      step={5}
                      value={[assumptions.marketplaceAdoptionRate]}
                      onValueChange={(value) => updateAssumption('marketplaceAdoptionRate', value[0])}
                    />
                    <div className="text-sm text-muted-foreground">{assumptions.marketplaceAdoptionRate}% of customers use marketplace</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dealerWebsiteCost">Dealer Website ($/month)</Label>
                    <Input
                      id="dealerWebsiteCost"
                      type="number"
                      value={assumptions.dealerWebsiteCost}
                      onChange={(e) => updateAssumption('dealerWebsiteCost', parseInt(e.target.value) || 0)}
                    />
                    <div className="text-sm text-muted-foreground">${(assumptions.dealerWebsiteCost * 12).toLocaleString()} annually per website</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leadGenCostPerLead">Lead Generation ($/lead)</Label>
                    <Input
                      id="leadGenCostPerLead"
                      type="number"
                      value={assumptions.leadGenCostPerLead}
                      onChange={(e) => updateAssumption('leadGenCostPerLead', parseInt(e.target.value) || 0)}
                    />
                    <div className="text-sm text-muted-foreground">Cost per qualified lead generated</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerAcquisitionCost">Customer Acquisition Cost ($)</Label>
                    <Input
                      id="customerAcquisitionCost"
                      type="number"
                      value={assumptions.customerAcquisitionCost}
                      onChange={(e) => updateAssumption('customerAcquisitionCost', parseInt(e.target.value) || 0)}
                    />
                    <div className="text-sm text-muted-foreground">Cost to acquire each dealership customer</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerLifetimeYears">Customer Lifetime (years)</Label>
                    <Slider
                      id="customerLifetimeYears"
                      min={2}
                      max={15}
                      step={1}
                      value={[assumptions.customerLifetimeYears]}
                      onValueChange={(value) => updateAssumption('customerLifetimeYears', value[0])}
                    />
                    <div className="text-sm text-muted-foreground">{assumptions.customerLifetimeYears} years average retention</div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualChurnRate">Annual Churn Rate (%)</Label>
                    <Slider
                      id="annualChurnRate"
                      min={5}
                      max={30}
                      step={1}
                      value={[assumptions.annualChurnRate]}
                      onValueChange={(value) => updateAssumption('annualChurnRate', value[0])}
                    />
                    <div className="text-sm text-muted-foreground">{assumptions.annualChurnRate}% customers leave annually</div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Customer LTV</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(marketOpportunity.customerLifetimeValue)}</div>
                      <p className="text-sm text-muted-foreground">Lifetime value per customer</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">LTV/CAC Ratio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{marketOpportunity.ltvcacRatio.toFixed(1)}x</div>
                      <p className="text-sm text-muted-foreground">
                        {marketOpportunity.ltvcacRatio >= 3 ? '✅ Healthy ratio' : '⚠️ Needs improvement'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Payback Period</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(assumptions.customerAcquisitionCost / (assumptions.saasBasePricing * 12) * 12)} months
                      </div>
                      <p className="text-sm text-muted-foreground">Time to recover CAC</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Opportunity Tab */}
          <TabsContent value="opportunity" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(marketOpportunity.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Annual revenue at {assumptions.marketPenetration}% penetration</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SaaS Revenue</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(marketOpportunity.annualSaasRevenue)}</div>
                  <p className="text-xs text-muted-foreground">{marketOpportunity.targetDealerships.toLocaleString()} customers × ${assumptions.saasBasePricing}/month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transaction Fees</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(marketOpportunity.transactionFeeRevenue)}</div>
                  <p className="text-xs text-muted-foreground">{assumptions.transactionFeeRate}% of {formatCurrency(marketOpportunity.totalTransactionValue)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Additional Services</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(marketOpportunity.websiteRevenue + marketOpportunity.leadGenRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Websites + Lead Generation</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Annual revenue by source at {assumptions.marketPenetration}% market penetration</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {revenueBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Penetration Impact</CardTitle>
                  <CardDescription>Revenue scaling with market share growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={penetrationScenarios}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="penetration" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}M`, 'Annual Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Model Details</CardTitle>
                <CardDescription>Detailed breakdown of revenue calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">SaaS Subscription Model</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Target Dealerships:</span>
                        <span>{marketOpportunity.targetDealerships.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Price:</span>
                        <span>${assumptions.saasBasePricing.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual SaaS Revenue:</span>
                        <span className="font-semibold">{formatCurrency(marketOpportunity.annualSaasRevenue)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Transaction Fee Model</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Marketplace Users:</span>
                        <span>{marketOpportunity.marketplaceUsers.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Transactions:</span>
                        <span>{marketOpportunity.totalTransactions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Fee Rate:</span>
                        <span>{assumptions.transactionFeeRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaction Fee Revenue:</span>
                        <span className="font-semibold">{formatCurrency(marketOpportunity.transactionFeeRevenue)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Growth Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Penetration Scenarios</CardTitle>
                <CardDescription>Revenue projections across different market share scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={penetrationScenarios}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="penetration" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `$${value}M` : value.toLocaleString(),
                        name === 'revenue' ? 'Annual Revenue' : 'Dealerships'
                      ]} 
                    />
                    <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
                    <Bar dataKey="dealerships" fill="#82ca9d" name="dealerships" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conservative (5-10%)</CardTitle>
                  <CardDescription>Early market entry scenario</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">$25-50M</div>
                  <p className="text-sm text-muted-foreground">Annual revenue range</p>
                  <div className="text-sm">
                    <div>• 190-380 dealerships</div>
                    <div>• Focus on early adopters</div>
                    <div>• Prove product-market fit</div>
                    <div>• Build case studies</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Moderate (15-20%)</CardTitle>
                  <CardDescription>Market leadership scenario</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">$75-100M</div>
                  <p className="text-sm text-muted-foreground">Annual revenue range</p>
                  <div className="text-sm">
                    <div>• 570-760 dealerships</div>
                    <div>• Market leadership position</div>
                    <div>• Competitive differentiation</div>
                    <div>• Strategic partnerships</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Aggressive (25-35%)</CardTitle>
                  <CardDescription>Market dominance scenario</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">$125-175M</div>
                  <p className="text-sm text-muted-foreground">Annual revenue range</p>
                  <div className="text-sm">
                    <div>• 950-1,335 dealerships</div>
                    <div>• Market dominance</div>
                    <div>• Platform ecosystem</div>
                    <div>• Acquisition opportunities</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Investment Requirements by Scenario</CardTitle>
                <CardDescription>Capital requirements to achieve different market penetration levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-gray-300 p-2 text-left">Scenario</th>
                        <th className="border border-gray-300 p-2 text-left">Market Share</th>
                        <th className="border border-gray-300 p-2 text-left">Customers</th>
                        <th className="border border-gray-300 p-2 text-left">Annual Revenue</th>
                        <th className="border border-gray-300 p-2 text-left">Investment Required</th>
                        <th className="border border-gray-300 p-2 text-left">Timeline</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2">Conservative</td>
                        <td className="border border-gray-300 p-2">5-10%</td>
                        <td className="border border-gray-300 p-2">190-380</td>
                        <td className="border border-gray-300 p-2">$25-50M</td>
                        <td className="border border-gray-300 p-2">$30-50M</td>
                        <td className="border border-gray-300 p-2">3-5 years</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Moderate</td>
                        <td className="border border-gray-300 p-2">15-20%</td>
                        <td className="border border-gray-300 p-2">570-760</td>
                        <td className="border border-gray-300 p-2">$75-100M</td>
                        <td className="border border-gray-300 p-2">$80-120M</td>
                        <td className="border border-gray-300 p-2">5-7 years</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Aggressive</td>
                        <td className="border border-gray-300 p-2">25-35%</td>
                        <td className="border border-gray-300 p-2">950-1,335</td>
                        <td className="border border-gray-300 p-2">$125-175M</td>
                        <td className="border border-gray-300 p-2">$150-250M</td>
                        <td className="border border-gray-300 p-2">7-10 years</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Success Factors</CardTitle>
                <CardDescription>Critical elements for achieving market penetration goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Product & Technology</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Marketplace-first entry strategy</li>
                      <li>• Modern, cloud-native architecture</li>
                      <li>• API-first integration approach</li>
                      <li>• Mobile-optimized user experience</li>
                      <li>• Real-time analytics and insights</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Go-to-Market</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Focus on used truck optimization</li>
                      <li>• Service department efficiency gains</li>
                      <li>• Strategic OEM partnerships</li>
                      <li>• Industry thought leadership</li>
                      <li>• Customer success and retention</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
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

