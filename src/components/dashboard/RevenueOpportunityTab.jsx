import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, Calculator, ShoppingCart, Globe } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { Slider } from '@/components/ui/slider'

const RevenueOpportunityTab = ({ marketOpportunity, assumptions, penetrationScenarios, baseMarketData }) => {
  // Local adoption slider (0-100%) — instantaneous adoption with no ramp
  const [adoptionPercent, setAdoptionPercent] = useState(assumptions.marketPenetration || 15)

  // Derive implementation and maintenance annual revenue from the implementation plan (first 12 months)
  const annualized = (() => {
    const monthsToAggregate = 12
    let annualImplementation = 0
    let annualMaintenance = 0
    const maintenancePercentage = assumptions.maintenancePercentage || 18
    const maintenanceStartMonth = assumptions.maintenanceStartMonth || 3
    const pricePerImplementation = assumptions.implementationPrice || 500000

    // Sum implementations for first 12 months and compute maintenance that begins within those months
    for (let i = 0; i < monthsToAggregate; i++) {
      const count = assumptions.implementationPlan?.[i] ?? 0
      if (count > 0) {
        const revenueThisMonth = count * pricePerImplementation
        annualImplementation += revenueThisMonth
        // Add maintenance months that occur within the 12-month window
        for (let m = i + maintenanceStartMonth; m < monthsToAggregate; m++) {
          annualMaintenance += (revenueThisMonth * (maintenancePercentage / 100)) / 12
        }
      }
    }

    // Derive revenue components aligned with Income Statement
    // Subscriptions on the Income Statement = SaaS + Dealer Websites
    const saas = marketOpportunity.annualSaasRevenue || 0
    const websites = marketOpportunity.websiteRevenue || 0
    const subscription = saas + websites
    const transactions = marketOpportunity.transactionFeeRevenue || 0

    return {
      saas,
      websites,
      subscription,
      transactions,
      implementations: annualImplementation,
      maintenance: annualMaintenance,
      // Total here intentionally excludes lead-gen to match Income Statement categories
      total: subscription + transactions + annualImplementation + annualMaintenance,
    }
  })()

  // Annual revenue at selected adoption (no ramp): subscriptions + transactions
  const adoptionAnnual = useMemo(() => {
    const customers = Math.round((baseMarketData.totalDealerships || 3816) * (adoptionPercent / 100))
    const saas = assumptions.saasBasePricing || 0
    const website = assumptions.dealerWebsiteCost || 0
    const pricePerMonth = saas + website
    const subscription = customers * pricePerMonth * 12

    const avgPrice = assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice
    const tpcYear = assumptions.transactionsPerCustomer || 168
    const feeRate = (assumptions.transactionFeeRate || 0) / 100
    const annualTransactionCount = customers * tpcYear
    const annualTransactionValue = annualTransactionCount * avgPrice
    const transactions = annualTransactionValue * feeRate
    const avgTransactionFeeNet = avgPrice * feeRate

    return {
      customers,
      subscription,
      transactions,
      annualTransactionValue,
      annualTransactionCount,
      avgTransactionFeeNet,
      total: subscription + transactions + (annualized.implementations || 0) + (annualized.maintenance || 0)
    }
  }, [adoptionPercent, assumptions, baseMarketData, annualized])

  // Pie chart breakdown: split SaaS and Dealer Websites; drop $0 categories (esp. implementations/maintenance)
  const revenueBreakdown = [
    { name: 'SaaS Subscriptions', value: annualized.saas, color: '#8884d8' },
    { name: 'Dealer Websites', value: annualized.websites, color: '#ffc658' },
    { name: 'Transaction Fees', value: annualized.transactions, color: '#82ca9d' },
    { name: 'Implementations', value: annualized.implementations, color: '#6b7280' },
    { name: 'Maintenance', value: annualized.maintenance, color: '#60a5fa' },
  ].filter((s) => (s.value || 0) > 0)

  // Adjust penetration scenarios locally to use aligned totals (exclude lead-gen)
  const adjustedPenetrationScenarios = penetrationScenarios.map((s) => {
    const pct = parseFloat(String(s.penetration).replace('%', '')) || 0
    const currentPen = assumptions.marketPenetration || 1
    const revenueMillions = (annualized.total * (pct / currentPen)) / 1e6
    return {
      ...s,
      revenue: Number(revenueMillions.toFixed(1))
    }
  })

  return (
    <div className="space-y-6">
      {/* Adoption control */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium">Market Adoption</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Slider min={0} max={100} step={1} value={[adoptionPercent]} onValueChange={(v)=>setAdoptionPercent(v[0])} />
            </div>
            <div className="w-20 text-right text-sm text-muted-foreground">{adoptionPercent}%</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(adoptionAnnual.total)}</div>
            <p className="text-xs text-muted-foreground">Annual revenue at {adoptionAnnual.customers.toLocaleString()} dealers onboarded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Revenue</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(adoptionAnnual.subscription)}</div>
            <p className="text-xs text-muted-foreground">
              Annual Subscription Revenue at {adoptionAnnual.customers.toLocaleString()} Dealers • {formatCurrency(assumptions.saasBasePricing || 0)} SaaS Subscription + {formatCurrency(assumptions.dealerWebsiteCost || 0)} Dealer Website Subscription per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Fees</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(adoptionAnnual.transactions)}</div>
            <div className="text-xs text-muted-foreground">
              <div>Annual transaction volume: {formatNumber(adoptionAnnual.annualTransactionCount)} units</div>
              <div>Avg transaction fee (net): {formatCurrency(adoptionAnnual.avgTransactionFeeNet)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implementations + Maintenance</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(annualized.implementations + annualized.maintenance)}</div>
            <p className="text-xs text-muted-foreground">One-time implementations plus recurring maintenance</p>
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
              <AreaChart data={adjustedPenetrationScenarios}>
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
              <h4 className="font-semibold">Subscription Model</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Target Dealerships:</span>
                  <span>{marketOpportunity.targetDealerships.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Price:</span>
                  <span>${assumptions.saasBasePricing.toLocaleString()} + ${assumptions.dealerWebsiteCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Subscription Revenue:</span>
                  <span className="font-semibold">{formatCurrency((marketOpportunity.annualSaasRevenue || 0) + (marketOpportunity.websiteRevenue || 0))}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Transaction Fee Model</h4>
              <div className="space-y-2 text-sm">
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
    </div>
  )
}

export default RevenueOpportunityTab

