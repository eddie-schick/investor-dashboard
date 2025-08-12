import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, AreaChart, Area } from 'recharts'
import { formatCurrency } from '@/utils/formatters'

const KPITab = ({ assumptions, marketOpportunity, baseMarketData }) => {
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

  // Compute monthly revenue streams aligned with IncomeStatementTab and assumptions
  const monthlyData = useMemo(() => {
    const data = []
    const implementationProjects = []
    months.forEach((period, index) => {
      // Implementation schedule from assumptions.implementationPlan (defaults to 0)
      let implementationRevenue = 0
      const implementationsThisMonth = (assumptions.implementationPlan?.[index] ?? 0)
      if (implementationsThisMonth > 0) {
        implementationRevenue = implementationsThisMonth * (assumptions.implementationPrice || 500000)
        implementationProjects.push({ startMonth: index, revenue: implementationRevenue })
      }

      const monthsSinceStart = index
      const growthMultiplier = 1 + (monthsSinceStart * 0.015)
      const baseCustomers = Math.floor((assumptions.marketPenetration / 100) * (baseMarketData.totalDealerships || 3816) * growthMultiplier)
      const monthlyChurnRate = (assumptions.annualChurnRate / 100) / 12
      const retentionRate = Math.pow(1 - monthlyChurnRate, monthsSinceStart)
      const customers = Math.floor(baseCustomers * retentionRate)

      const subscriptionRevenue = customers * (assumptions.saasBasePricing || 0)
      const seasonalFactor = [0.8, 0.9, 1.0, 1.1, 1.2, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.1][period.month]
      const avgTruckPrice = assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice
      const transactionsPerCustomer = (assumptions.transactionsPerCustomer || 168) / 12 * seasonalFactor
      const transactionRevenue = customers * transactionsPerCustomer * avgTruckPrice * ((assumptions.transactionFeeRate || 0) / 100)

      // Maintenance after delay
      let maintenanceRevenue = 0
      const maintenancePercentage = assumptions.maintenancePercentage || 18
      const maintenanceStartMonth = assumptions.maintenanceStartMonth || 3
      implementationProjects.forEach((p) => {
        const monthsSinceImplementation = index - p.startMonth
        if (monthsSinceImplementation >= maintenanceStartMonth) {
          maintenanceRevenue += (p.revenue * (maintenancePercentage / 100)) / 12
        }
      })

      const websites = customers * (assumptions.dealerWebsiteCost || 0)
      const leadGen = customers * (500 / 12) * (assumptions.leadGenCostPerLead || 0)

      const totalRevenue = subscriptionRevenue + transactionRevenue + implementationRevenue + maintenanceRevenue + websites + leadGen

      data.push({
        period,
        customers,
        subscriptionRevenue,
        transactionRevenue,
        implementationRevenue,
        maintenanceRevenue,
        websiteRevenue: websites,
        leadGenRevenue: leadGen,
        totalRevenue,
      })
    })
    return data
  }, [months, assumptions, baseMarketData])

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
          websiteRevenue: group.reduce((s, m) => s + m.websiteRevenue, 0),
          leadGenRevenue: group.reduce((s, m) => s + m.leadGenRevenue, 0),
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
          websiteRevenue: 0,
          leadGenRevenue: 0,
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
      row.websiteRevenue += m.websiteRevenue
      row.leadGenRevenue += m.leadGenRevenue
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
      websiteRevenue: r.websiteRevenue,
      leadGenRevenue: r.leadGenRevenue,
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
      websiteRevenue: s.websiteRevenue + m.websiteRevenue,
      leadGenRevenue: s.leadGenRevenue + m.leadGenRevenue,
      totalRevenue: s.totalRevenue + m.totalRevenue,
    }), { customers: 0, subscriptionRevenue: 0, transactionRevenue: 0, implementationRevenue: 0, maintenanceRevenue: 0, websiteRevenue: 0, leadGenRevenue: 0, totalRevenue: 0 })
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
      websites: m.websiteRevenue,
      leadgen: m.leadGenRevenue,
      impl: m.implementationRevenue,
      maint: m.maintenanceRevenue,
    }))
  ), [monthlyData])
  const totalCustomers = marketOpportunity.targetDealerships || 0
  const marketplaceUsers = marketOpportunity.marketplaceUsers || 0

  const annualSaasRevenue = (selectedData?.subscriptionRevenue ?? marketOpportunity.annualSaasRevenue) || 0
  const transactionRevenue = (selectedData?.transactionRevenue ?? marketOpportunity.transactionFeeRevenue) || 0
  const websiteRevenue = (selectedData?.websiteRevenue ?? marketOpportunity.websiteRevenue) || 0
  const leadGenRevenue = (selectedData?.leadGenRevenue ?? marketOpportunity.leadGenRevenue) || 0
  const totalAnnualRevenue = (selectedData?.totalRevenue ?? marketOpportunity.totalRevenue) || 0

  const revenueBreakdown = [
    { name: 'SaaS', value: annualSaasRevenue, color: '#8884d8' },
    { name: 'Transactions', value: transactionRevenue, color: '#82ca9d' },
    { name: 'Websites', value: websiteRevenue, color: '#ffc658' },
    { name: 'Lead Gen', value: leadGenRevenue, color: '#ff7300' },
  ]

  const cac = assumptions.customerAcquisitionCost || 0
  const pricePerMonth = assumptions.saasBasePricing || 0
  const cacPaybackMonths = pricePerMonth > 0 ? Math.round((cac / (pricePerMonth * 12)) * 12) : 0

  const ltv = marketOpportunity.customerLifetimeValue || 0
  const ltvcac = marketOpportunity.ltvcacRatio || 0

  const totalTransactions = marketOpportunity.totalTransactions || 0
  const avgTransactionPrice = assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice

  const avgRevenuePerCustomer = totalCustomers > 0 ? totalAnnualRevenue / totalCustomers : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Analyze KPIs by month, quarter, year, or total</CardDescription>
          </div>
          <div className="flex gap-3 items-center">
            <Tabs value={granularity} onValueChange={(v) => { setGranularity(v); setSelectedKey(periodOptions[0]?.key || 'total') }}>
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
          <CardContent><div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Marketplace Users</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{marketplaceUsers.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ARR (SaaS)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(annualSaasRevenue)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Annual Revenue</CardTitle></CardHeader>
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
            <CardTitle>Revenue by Stream</CardTitle>
            <CardDescription>{granularity === 'total' ? 'Total period' : periodOptions.find(p => p.key === selectedKey)?.label} revenue mix</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={revenueBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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
                  <TableCell>Total Transactions (annual)</TableCell>
                  <TableCell className="font-medium">{totalTransactions.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Avg Transaction Price</TableCell>
                  <TableCell className="font-medium">{formatCurrency(avgTransactionPrice)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Transaction Fee Rate</TableCell>
                  <TableCell className="font-medium">{assumptions.transactionFeeRate}%</TableCell>
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
            <CardDescription>Maximum active customers month by month</CardDescription>
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
            <CardDescription>Stacked monthly revenue growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueByStreamSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" hide={true} />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Area type="monotone" dataKey="saas" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="SaaS" />
                <Area type="monotone" dataKey="tx" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Transactions" />
                <Area type="monotone" dataKey="websites" stackId="1" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} name="Websites" />
                <Area type="monotone" dataKey="leadgen" stackId="1" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} name="Lead Gen" />
                <Area type="monotone" dataKey="impl" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.5} name="Implementation" />
                <Area type="monotone" dataKey="maint" stackId="1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.5} name="Maintenance" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default KPITab


