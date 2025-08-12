import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DollarSign, Building2, Calculator, Truck, AlertTriangle, Zap, Target } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

const MarketOverviewTab = ({ baseMarketData, marketOpportunity }) => {
  const marketSizeComparison = [
    { category: 'Current Software Market', value: baseMarketData.totalSoftwareMarket / 1e9, source: '2023 ATD Data' },
    { category: 'Transaction Opportunity', value: (baseMarketData.totalTransactionValue * 0.015) / 1e9, source: '1.5% fee estimate' },
    { category: 'Website Market', value: (baseMarketData.totalDealerships * 1000 * 12) / 1e9, source: '$1K/month estimate' },
    { category: 'Lead Gen Market', value: (baseMarketData.totalDealerships * 500 * 200) / 1e9, source: '500 leads × $200' },
    { category: 'Total Addressable', value: marketOpportunity.totalAddressableMarket / 1e9, source: 'Combined markets' }
  ]

  return (
    <div className="space-y-6">
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
    </div>
  )
}

export default MarketOverviewTab


