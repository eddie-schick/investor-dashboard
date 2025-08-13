import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip as RTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RCTooltip,
  Legend
} from 'recharts'
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  Zap,
  TrendingUp,
  Percent,
  Wrench
} from 'lucide-react'

const formatCurrencySmart = (value) => {
  const abs = Math.abs(value)
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
  return `$${Math.round(value).toLocaleString()}`
}

const MarketOverviewTab = () => {
  const verifiedClass = ''
  const calcClass = ''

  const comparisonRows = [
    { metric: 'Avg Revenue per Dealer', nada: '$73.31M', atd: '$62.03M', nadaValue: 73.31e6, atdValue: 62.03e6 },
    { metric: 'Total Industry Revenue', nada: '$1.24T', atd: '$130.2B', nadaValue: 1.24e12, atdValue: 130.2e9 },
    { metric: 'Avg Gross Profit Margin', nada: '~14%', atd: '14.8%' },
    { metric: 'Avg Net Profit Margin', nada: '~2.5%', atd: '3.4%' },
    { metric: 'Dealerships', nada: '16,957', atd: '3,798', nadaValue: 16957, atdValue: 3798 },
    { metric: 'Avg Employees', nada: '66', atd: '37', nadaValue: 66, atdValue: 37 },
    { metric: 'Fixed Absorption', nada: 'N/A*', atd: '98.0%*' },
    { metric: 'New Vehicle/Truck Sales', nada: '54.7% of revenue', atd: '61.0% of revenue' },
    { metric: 'Used Vehicle/Truck Sales', nada: '32.0% of revenue', atd: '4.9% of revenue' },
    { metric: 'Service & Parts', nada: '13.2% of revenue', atd: '34.2% of revenue' },
    { metric: 'Service & Parts Gross Margin', nada: '46.5%', atd: '37.4%' },
    { metric: 'Avg Weekly Earnings', nada: '$1,571', atd: 'Not specified' },
    { metric: 'Annual Payroll per Dealer', nada: '$5.42M', atd: '~$4.2M', nadaValue: 5.42e6, atdValue: 4.2e6 },
    { metric: 'Advertising per Unit Sold', nada: '$705', atd: 'Not specified', nadaValue: 705 },
    { metric: 'Total Repair Orders', nada: '270M annually', atd: '10.0M annually', nadaValue: 270e6, atdValue: 10.0e6 },
  ]

  const [sortKey, setSortKey] = useState('metric')
  const [sortAsc, setSortAsc] = useState(true)
  const [filterText, setFilterText] = useState('')
  const [showSupplemental, setShowSupplemental] = useState(false)

  const sortedFilteredRows = useMemo(() => {
    const filtered = comparisonRows.filter(r => r.metric.toLowerCase().includes(filterText.toLowerCase()))
    const rows = [...filtered]
    rows.sort((a, b) => {
      if (sortKey === 'nada' || sortKey === 'atd') {
        const av = a[sortKey + 'Value'] ?? Number.NaN
        const bv = b[sortKey + 'Value'] ?? Number.NaN
        if (Number.isNaN(av) && Number.isNaN(bv)) return 0
        if (Number.isNaN(av)) return 1
        if (Number.isNaN(bv)) return -1
        return sortAsc ? av - bv : bv - av
      }
      const av = String(a[sortKey] || '')
      const bv = String(b[sortKey] || '')
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return rows
  }, [sortKey, sortAsc, filterText])

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const nadaEmployment = [
    { name: 'Technicians', value: 24.8, color: '#10b981' },
    { name: 'Other Service/Parts', value: 23.5, color: '#22c55e' },
    { name: 'New/Used Salespeople', value: 18.0, color: '#60a5fa' },
    { name: 'Supervisors', value: 13.1, color: '#818cf8' },
    { name: 'Others', value: 20.6, color: '#93c5fd' },
  ]
  const atdEmployment = [
    { name: 'Other Service/Parts', value: 44.1, color: '#22c55e' },
    { name: 'Supervisors', value: 33.9, color: '#818cf8' },
    { name: 'Technicians', value: 10.5, color: '#10b981' },
    { name: 'Others', value: 6.6, color: '#93c5fd' },
    { name: 'New/Used Salespeople', value: 4.8, color: '#60a5fa' },
  ]

  const currentStack = [
    { system: 'DMS', monthly: 5000, percent: 28.6, vendors: 'CDK Global Heavy Truck; Reynolds and Reynolds', functions: 'Inventory, accounting, sales, service records', pain: 'Legacy architecture, complex integrations, desktop-centric, high switching costs' },
    { system: 'CRM', monthly: 3000, percent: 17.1, vendors: 'Various', functions: 'Lead management, tracking, sales pipeline, communication', pain: 'Disconnected from inventory and service systems' },
    { system: 'Digital Retail', monthly: 4000, percent: 22.9, vendors: 'Various', functions: 'Online browsing, e-commerce, digital showroom', pain: 'Does not connect well to in-store processes' },
    { system: 'Inventory Management', monthly: 2000, percent: 11.4, vendors: 'vAuto (example)', functions: 'Pricing optimization, tracking, market analysis', pain: 'Pricing in isolation, missing real-time market context' },
    { system: 'F&I Systems', monthly: 2000, percent: 11.4, vendors: 'RouteOne; Dealertrack', functions: 'Credit apps, financing, insurance products', pain: 'Manual re-entry, limited integration' },
    { system: 'Service Tools', monthly: 1500, percent: 8.6, vendors: 'Various', functions: 'Scheduling, parts, work orders', pain: 'Siloed from sales operations' },
  ]
  const totalMonthlySpend = currentStack.reduce((s, x) => s + x.monthly, 0)
  const retailDealers = 16957
  const commercialDealers = 3798
  const totalDealers = retailDealers + commercialDealers
  const computeIndustryAnnual = (monthly) => monthly * 12 * totalDealers
  const industryTotalSoftwareSpend = currentStack.reduce((s, x) => s + computeIndustryAnnual(x.monthly), 0)
  const techSummaryCards = [
    { label: 'Avg Annual Software Spend / Dealer', value: '$210,000+' },
    { label: 'Industry Total Software Spend', value: `${formatCurrencySmart(industryTotalSoftwareSpend)}*`, calc: true, tooltip: `*Calculated: sum of (monthly × 12 × ${totalDealers.toLocaleString()} dealerships)` },
    { label: 'Systems per Dealer', value: '6–8 systems' },
    { label: 'Software Categories', value: '20+ categories' },
  ]

  const financialCards = [
    { title: 'Retail Gross Profit / Dealer', value: '$10.3M' },
    { title: 'Commercial Gross Profit / Dealer', value: '$12.38M*', calc: true, tooltip: '*Calculated from ATD reported margins and average revenue' },
    { title: 'Retail Net Profit / Dealer', value: '$1.8M' },
    { title: 'Commercial Net Profit / Dealer', value: '$2.11M*', calc: true, tooltip: '*Calculated from ATD reported margins and average revenue' },
    { title: 'Retail ROI', value: '~11%' },
    { title: 'Commercial ROI', value: '~12%' },
  ]

  const nadaRevenueByYear = [
    { year: '2017', value: 980.25e9 },
    { year: '2018', value: 1002.62e9 },
    { year: '2019', value: 1026.82e9 },
    { year: '2020', value: 1025.80e9 },
    { year: '2021', value: 1184.39e9 },
    { year: '2022', value: 1205.36e9 },
    { year: '2023', value: 1207.23e9 },
    { year: '2024', value: 1243.17e9 },
  ]
  const atdEmploymentByYear = [
    { year: '2017', value: 122730 },
    { year: '2018', value: 125450 },
    { year: '2019', value: 131340 },
    { year: '2020', value: 133680 },
    { year: '2021', value: 139930 },
    { year: '2022', value: 145310 },
    { year: '2023', value: 148990 },
    { year: '2024', value: 139928 },
  ]

  const retailOwnership = [
    { name: '1–5 stores', value: 91.0, color: '#60a5fa' },
    { name: '6–10', value: 5.5, color: '#93c5fd' },
    { name: '11–25', value: 2.7, color: '#bfdbfe' },
    { name: '26–50', value: 0.6, color: '#dbeafe' },
    { name: '>50', value: 0.2, color: '#eff6ff' },
  ]
  const commercialOwnership = [
    { name: '1–5 stores', value: 94.5, color: '#34d399' },
    { name: '6–10', value: 3.4, color: '#6ee7b7' },
    { name: '26–50', value: 0.3, color: '#a7f3d0' },
    { name: '>50', value: 0.1, color: '#d1fae5' },
  ]

  const renderOwnershipLabel = ({ name, percent }) => {
    const pct = percent * 100
    if (pct < 4) return null
    return `${name} ${pct.toFixed(0)}%`
  }

  const retailSalesVolumeDist = [
    { range: '1–149', pct: 17.9 },
    { range: '150–299', pct: 19.0 },
    { range: '300–499', pct: 16.5 },
    { range: '500–749', pct: 15.4 },
    { range: '750–1,499', pct: 20.8 },
    { range: '1,500+', pct: 10.3 },
  ]

  const serviceKpis = [
    { label: 'Retail Total ROs', value: '270M+' },
    { label: 'Commercial Total ROs', value: '10.0M' },
    { label: 'Customer Labor Rate', value: '$171/hr' },
    { label: 'Sales per Customer RO', value: '$7,399' },
    { label: 'Sales per Warranty RO', value: '$15,215' },
    { label: 'Parts per Service Labor $', value: '$3.54' },
    { label: 'Body Shop (Retail)', value: '28.0% of stores' },
    { label: 'Body Shop (Commercial)', value: '32.1% of stores' },
  ]

  const adPayroll = [
    { label: 'Retail Total Advertising', value: '$9.22B' },
    { label: 'Retail Avg per Dealership', value: '$543,947' },
    { label: 'Retail Advertising per New Unit', value: '$705' },
    { label: 'Commercial Total Advertising', value: '$402.5M*', calc: true, tooltip: '*Calculated: $105,963 × 3,798 dealers' },
    { label: 'Commercial Avg per Dealership', value: '$105,963' },
    { label: 'Commercial Ad per Class 8 New Unit', value: '$584' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>U.S. Automotive Dealership Market Overview 2024</CardTitle>
          <CardDescription>Key verified metrics to anchor market size and performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="text-sm font-semibold mb-2">Primary Market Metrics</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-700"><span className={calcClass}>20,755</span></div>
                <div className="text-sm text-muted-foreground">Total Dealerships</div>
                <div className="text-xs text-muted-foreground mt-1"><span className={verifiedClass}>16,957</span> Retail franchised new-car • <span className={verifiedClass}>3,798</span> Commercial truck</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-700">$1.37 Trillion</div>
                <div className="text-sm text-muted-foreground">Combined Annual Sales</div>
                <div className="text-xs text-muted-foreground mt-1">$1.24T Retail • $130.2B Commercial</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-700">16.3M</div>
                <div className="text-sm text-muted-foreground">Total Vehicles Sold</div>
                <div className="text-xs text-muted-foreground mt-1">15.85M Light-duty (Retail) • 482,274 Medium/Heavy-duty (Commercial)</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-700">280M+</div>
                <div className="text-sm text-muted-foreground">Total Repair Orders</div>
                <div className="text-xs text-muted-foreground mt-1">270M (Retail) • 10M (Commercial)</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-700">1,262,045</div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
                <div className="text-xs text-muted-foreground mt-1"><span className={verifiedClass}>1,122,117</span> Retail • <span className={calcClass}>139,928*</span> Commercial
                  <RTooltip>
                    <TooltipTrigger asChild>
                      <Info className="inline-block ml-1 h-3.5 w-3.5 text-muted-foreground align-text-top cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>*Estimated based on 37 employees per dealership × 3,798 dealerships. ATD reports 63 avg but includes all dealer types.</TooltipContent>
                  </RTooltip>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{`${formatCurrencySmart(industryTotalSoftwareSpend)}*`}</div>
                <div className="text-sm text-muted-foreground">Total Software Spend</div>
                <div className="text-xs text-muted-foreground mt-1">Calculated from monthly × 12 × total dealerships
                  <RTooltip>
                    <TooltipTrigger asChild>
                      <Info className="inline-block ml-1 h-3.5 w-3.5 text-muted-foreground align-text-top cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>{`*Sum of each category: monthly × 12 × ${totalDealers.toLocaleString()} dealerships`}</TooltipContent>
                  </RTooltip>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pain Points & Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold">Software Fragmentation</h4>
              </div>
              <p className="text-sm text-muted-foreground">Average dealer uses 6–8 disconnected systems</p>
              <p className="text-sm text-muted-foreground">Annual software spend: <span className="font-medium">$210,000+</span> per dealership</p>
              <p className="text-sm text-muted-foreground">Integration challenges with DMS (CDK, Reynolds)</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">Time Inefficiency</h4>
              </div>
              <p className="text-sm text-muted-foreground">20% of employee time wasted on manual processes</p>
              <p className="text-sm text-muted-foreground">Cost Impact: <span className="font-medium">$52B</span> lost productivity annually</p>
              <p className="text-lg font-semibold text-green-600">Opportunity: Recover 10–15% via digital transformation</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold">Used Vehicle Losses</h4>
              </div>
              <p className="text-sm text-muted-foreground">Retail: Breaking even or slight loss on used vehicles</p>
              <p className="text-sm text-muted-foreground">Commercial: Losing $3,082 per used truck sold</p>
              <p className="text-lg font-semibold text-red-600">Total impact: ~$525M annually<span className="text-sm">*</span>
                <RTooltip>
                  <TooltipTrigger asChild>
                    <Info className="inline-block ml-1 h-4 w-4 text-muted-foreground align-text-top cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>*Calculated from ATD reported loss per unit and average used units sold</TooltipContent>
                </RTooltip>
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">Service Department Potential</h4>
              </div>
              <p className="text-sm text-muted-foreground">Retail Service Gross Margin: <span className="font-medium">46.5%</span></p>
              <p className="text-sm text-muted-foreground">Commercial Service Gross Margin: <span className="font-medium">37.4%</span></p>
              <p className="text-lg font-semibold text-green-600">Highest profit center but underutilized</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technology Opportunity</CardTitle>
          <CardDescription>Current dealer tech stack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techSummaryCards.map((c) => (
              <div key={c.label} className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">{c.label}</div>
                <div className="text-xl font-semibold text-blue-700">
                  {c.calc ? (
                    <>
                      <span className={calcClass}>{c.value}</span>
                      {c.tooltip && (
                        <RTooltip>
                          <TooltipTrigger asChild>
                            <Info className="inline-block ml-1 h-4 w-4 text-muted-foreground align-text-top cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>{c.tooltip}</TooltipContent>
                        </RTooltip>
                      )}
                    </>
                  ) : (
                    c.value
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-2">Current Dealer Tech Stack</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System</TableHead>
                    <TableHead>Monthly Cost</TableHead>
                    <TableHead>Share of Spend</TableHead>
                    <TableHead>Industry Annual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentStack.map((row) => {
                    const annualIndustry = computeIndustryAnnual(row.monthly)
                    return (
                      <TableRow key={row.system}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {row.system}
                          <RTooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <div><span className="font-semibold">Vendors:</span> {row.vendors}</div>
                                <div><span className="font-semibold">Functions:</span> {row.functions}</div>
                                <div><span className="font-semibold">Pain Points:</span> {row.pain}</div>
                              </div>
                            </TooltipContent>
                          </RTooltip>
                        </TableCell>
                        <TableCell>{formatCurrency(row.monthly)}</TableCell>
                        <TableCell>{row.percent ? `${row.percent}%` : '—'}</TableCell>
                        <TableCell>{formatCurrencySmart(annualIndustry)}</TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow>
                    <TableCell className="font-semibold">Total</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(totalMonthlySpend)} / mo ({formatCurrencySmart(totalMonthlySpend * 12)} / yr)</TableCell>
                    <TableCell className="font-semibold">100%</TableCell>
                    <TableCell className="font-semibold">{`${formatCurrencySmart(industryTotalSoftwareSpend)}*`}
                      <RTooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline-block ml-1 h-3.5 w-3.5 text-muted-foreground align-text-top cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>{`*Sum of each category (monthly × 12 × ${totalDealers.toLocaleString()} dealerships)`}</TooltipContent>
                      </RTooltip>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Checkbox id="show-supplementary" checked={showSupplemental} onCheckedChange={(v) => setShowSupplemental(!!v)} />
        <Label htmlFor="show-supplementary">Show Supplementary Dealer Information</Label>
      </div>

      {showSupplemental && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Dealership Financial Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 border rounded-xl bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Average Dealership Revenue</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[15px] font-semibold">Retail: $73.31M per dealership</div>
                    <div className="text-[15px] font-semibold">Commercial: <span className={verifiedClass}>$62.03M</span> per dealership</div>
                  </div>
                </div>
                <div className="p-5 border rounded-xl bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Percent className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Net Profit Margins</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[15px] font-semibold">Commercial: 3.4% (2024)</div>
                    <div className="text-[15px] font-semibold">Industry Average: 2.6–3.4%</div>
                  </div>
                </div>
                <div className="p-5 border rounded-xl bg-muted/30 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Wrench className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Service & Parts Revenue</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[15px] font-semibold">Retail: $156.46B total ($9.23M per dealer)</div>
                    <div className="text-[15px] font-semibold">Commercial: <span className={verifiedClass}>$45.42B</span> total (<span className={calcClass}>$11.96M*</span> per dealer)
                      <RTooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline-block ml-1 h-3.5 w-3.5 text-muted-foreground align-text-top cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>*Calculated: $45.42B ÷ 3,798 dealers</TooltipContent>
                      </RTooltip>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service & Parts KPIs</CardTitle>
              <CardDescription>Operational benchmarks across Retail and Commercial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {serviceKpis.map((k) => (
                  <div key={k.label} className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">{k.label}</div>
                    <div className="text-xl font-semibold text-blue-700">{k.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advertising & Payroll Snapshot</CardTitle>
              <CardDescription>Marketing spend indicators to gauge CAC pressure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {adPayroll.map((k) => (
                  <div key={k.label} className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">{k.label}</div>
                    <div className="text-xl font-semibold text-blue-700">
                      {k.calc ? (
                        <>
                          <span className={calcClass}>{k.value}</span>
                          {k.tooltip && (
                            <RTooltip>
                              <TooltipTrigger asChild>
                                <Info className="inline-block ml-1 h-4 w-4 text-muted-foreground align-text-top cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>{k.tooltip}</TooltipContent>
                            </RTooltip>
                          )}
                        </>
                      ) : (
                        k.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Performance</CardTitle>
              <CardDescription>Key profitability and return metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {financialCards.map((fc) => (
                  <div key={fc.title} className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">{fc.title}</div>
                    <div className="text-xl font-semibold text-blue-700">
                      {fc.calc ? (
                        <>
                          <span className={calcClass}>{fc.value}</span>
                          {fc.tooltip && (
                            <RTooltip>
                              <TooltipTrigger asChild>
                                <Info className="inline-block ml-1 h-4 w-4 text-muted-foreground align-text-top cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>{fc.tooltip}</TooltipContent>
                            </RTooltip>
                          )}
                        </>
                      ) : (
                        fc.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {showSupplemental && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Retail Ownership Structure</CardTitle>
                <CardDescription>Distribution of ownership groups by store count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={retailOwnership}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      labelLine={false}
                      label={renderOwnershipLabel}
                    >
                      {retailOwnership.map((entry, i) => (
                        <Cell key={`ret-own-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={24} />
                    <RCTooltip formatter={(v, n) => [`${v}%`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Commercial Ownership Structure</CardTitle>
                <CardDescription>Distribution of ownership groups by store count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={commercialOwnership}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      labelLine={false}
                      label={renderOwnershipLabel}
                    >
                      {commercialOwnership.map((entry, i) => (
                        <Cell key={`com-own-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={24} />
                    <RCTooltip formatter={(v, n) => [`${v}%`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employment Mix</CardTitle>
              <CardDescription>Role distribution across Retail and Commercial dealerships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={nadaEmployment} dataKey="value" nameKey="name" outerRadius={95} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {nadaEmployment.map((entry, index) => (
                          <Cell key={`nada-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RCTooltip formatter={(v, name) => [`${v}%`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-muted-foreground mt-1">Retail Employment Mix</div>
                </div>
                <div className="p-0">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={atdEmployment} dataKey="value" nameKey="name" outerRadius={95} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {atdEmployment.map((entry, index) => (
                          <Cell key={`atd-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RCTooltip formatter={(v, name) => [`${v}%`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-muted-foreground mt-1">Commercial Employment Mix</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retail Sales Volume Distribution</CardTitle>
              <CardDescription>Share of dealerships by annual unit volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={retailSalesVolumeDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis tickFormatter={(v) => `${v}%`} />
                  <RCTooltip formatter={(v) => [`${v}%`, 'Dealers']} />
                  <Bar dataKey="pct" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Retail Historical Revenue (2017–2024)</CardTitle>
                <CardDescription>Industry revenue trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={nadaRevenueByYear}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `$${(v/1e9).toFixed(0)}B`} />
                    <RCTooltip formatter={(v) => [formatCurrencySmart(v), 'Revenue']} />
                    <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Commercial Employment Trends (2017–2024)</CardTitle>
                <CardDescription>Total employees across commercial truck dealers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={atdEmploymentByYear}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => formatNumber(v)} />
                    <RCTooltip formatter={(v) => [formatNumber(v), 'Employees']} />
                    <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dealer Comparison (Retail vs Commercial)</CardTitle>
              <CardDescription>Sortable and filterable comparison of key metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className="border rounded-md px-3 py-2 text-sm w-full md:w-72 bg-transparent"
                  placeholder="Filter metrics..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('metric')}>
                      Metric {sortKey === 'metric' ? (sortAsc ? '▲' : '▼') : ''}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('nada')}>
                      Retail {sortKey === 'nada' ? (sortAsc ? '▲' : '▼') : ''}
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('atd')}>
                      Commercial {sortKey === 'atd' ? (sortAsc ? '▲' : '▼') : ''}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFilteredRows.map((row) => (
                    <TableRow key={row.metric}>
                      <TableCell className="font-medium">{row.metric}</TableCell>
                      <TableCell>
                        {row.metric === 'Fixed Absorption' ? (
                          <span className={calcClass}>N/A*</span>
                        ) : row.metric === 'Avg Employees' || row.metric === 'Dealerships' || row.metric === 'Avg Revenue per Dealer' || row.metric === 'Total Industry Revenue' || row.metric === 'Total Repair Orders' || row.metric === 'New Vehicle/Truck Sales' || row.metric === 'Used Vehicle/Truck Sales' || row.metric === 'Service & Parts' || row.metric === 'Service & Parts Gross Margin' || row.metric === 'Advertising per Unit Sold' || row.metric === 'Avg Weekly Earnings' || row.metric === 'Avg Gross Profit Margin' || row.metric === 'Annual Payroll per Dealer' ? (
                          <span className={verifiedClass}>{row.nada}</span>
                        ) : (
                          row.nada
                        )}
                        {row.metric === 'Fixed Absorption' && (
                          <RTooltip>
                            <TooltipTrigger asChild>
                              <Info className="inline-block ml-1 h-4 w-4 text-muted-foreground align-text-top cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>*NADA does not report fixed absorption for retail dealerships</TooltipContent>
                          </RTooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.metric === 'Fixed Absorption' ? (
                          <span className={verifiedClass}>98.0%*</span>
                        ) : row.metric === 'Avg Employees' || row.metric === 'Dealerships' || row.metric === 'Avg Revenue per Dealer' || row.metric === 'Total Industry Revenue' || row.metric === 'Total Repair Orders' || row.metric === 'New Vehicle/Truck Sales' || row.metric === 'Used Vehicle/Truck Sales' || row.metric === 'Service & Parts' || row.metric === 'Service & Parts Gross Margin' ? (
                          <span className={verifiedClass}>{row.atd}</span>
                        ) : row.metric === 'Avg Net Profit Margin' ? (
                          <span className={verifiedClass}>3.4%</span>
                        ) : (
                          row.atd
                        )}
                        {row.metric === 'Fixed Absorption' && (
                          <RTooltip>
                            <TooltipTrigger asChild>
                              <Info className="inline-block ml-1 h-4 w-4 text-muted-foreground align-text-top cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>*2024 ATD data. Note: NADA does not track this metric for retail</TooltipContent>
                          </RTooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </>
      )}

      <div className="border-t pt-4">
        <div className="text-sm font-semibold mb-2">Source Reports</div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a
            href="https://www.nada.org/media/5008/download?inline"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open ATD Report (PDF)
          </a>
          <span className="text-muted-foreground">|</span>
          <a
            href="https://www.nada.org/media/4695/download?inline"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Open NADA Report (PDF)
          </a>
        </div>
      </div>
    </div>
  )
}

export default MarketOverviewTab


