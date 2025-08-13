import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/utils/formatters'
import { computeActiveCustomersWithOnboarding } from '@/utils/ramping'

const GrowthScenariosTab = ({ penetrationScenarios, assumptions, baseMarketData, marketOpportunity }) => {
  const totalDealerships = baseMarketData?.totalDealerships || 3816

  const makeScenarioRange = (minPct, maxPct) => {
    const minDealers = Math.round(totalDealerships * (minPct / 100))
    const maxDealers = Math.round(totalDealerships * (maxPct / 100))

    const calcAnnual = (dealers) => {
      const saasAnnual = dealers * (assumptions?.saasBasePricing || 0) * 12
      const websiteAnnual = dealers * (assumptions?.dealerWebsiteCost || 0) * 12
      const tpcYear = assumptions?.transactionsPerCustomer || 0
      const avgPrice = assumptions?.avgTransactionPrice || baseMarketData?.avgTruckPrice || 0
      const feeRate = (assumptions?.transactionFeeRate || 0) / 100
      const transactional = dealers * tpcYear * avgPrice * feeRate
      return saasAnnual + websiteAnnual + transactional
    }

    const annualRevenueMin = calcAnnual(minDealers)
    const annualRevenueMax = calcAnnual(maxDealers)

    const cac = assumptions?.customerAcquisitionCost || 0
    const investMin = cac * minDealers
    const investMax = cac * maxDealers

    let monthsToMin = null
    let monthsToMax = null
    if (assumptions?.useOnboardingPlan && Array.isArray(assumptions?.onboardingPlan)) {
      for (let i = 0; i < assumptions.onboardingPlan.length; i++) {
        const active = computeActiveCustomersWithOnboarding(assumptions, i, totalDealerships)
        if (monthsToMin === null && active >= minDealers) monthsToMin = i + 1
        if (monthsToMax === null && active >= maxDealers) monthsToMax = i + 1
        if (monthsToMin !== null && monthsToMax !== null) break
      }
    }

    const formatMonthsRange = (a, b) => {
      if (a == null && b == null) return 'N/A'
      if (a != null && b == null) return `${Math.ceil(a / 12)}+ years`
      const yearsA = Math.ceil((a || 0) / 12)
      const yearsB = Math.ceil((b || 0) / 12)
      return yearsA === yearsB ? `${yearsA} years` : `${yearsA}-${yearsB} years`
    }

    return {
      minDealers,
      maxDealers,
      annualRevenueMin,
      annualRevenueMax,
      investMin,
      investMax,
      timelineLabel: formatMonthsRange(monthsToMin, monthsToMax)
    }
  }

  const conservative = makeScenarioRange(5, 10)
  const moderate = makeScenarioRange(15, 20)
  const aggressive = makeScenarioRange(25, 35)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Market Penetration Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={penetrationScenarios}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="penetration" />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null
                  const row = payload[0]?.payload || {}
                  return (
                    <div className="bg-background border rounded px-3 py-2 text-sm">
                      <div className="font-medium mb-1">{label}</div>
                      <div>Dealerships: {Number(row.dealerships || 0).toLocaleString()}</div>
                      <div>Annual Revenue: ${Number(row.revenue || 0)}M</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="dealerships" fill="#82ca9d" name="dealerships" barSize={56} />
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
            <div className="text-2xl font-bold">{`${Math.round(conservative.annualRevenueMin / 1e6)}-${Math.round(conservative.annualRevenueMax / 1e6)}M`}</div>
            <p className="text-sm text-muted-foreground">Annual revenue range</p>
            <div className="text-sm">
              <div>• {conservative.minDealers.toLocaleString()}-{conservative.maxDealers.toLocaleString()} dealerships</div>
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
            <div className="text-2xl font-bold">{`${Math.round(moderate.annualRevenueMin / 1e6)}-${Math.round(moderate.annualRevenueMax / 1e6)}M`}</div>
            <p className="text-sm text-muted-foreground">Annual revenue range</p>
            <div className="text-sm">
              <div>• {moderate.minDealers.toLocaleString()}-{moderate.maxDealers.toLocaleString()} dealerships</div>
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
            <div className="text-2xl font-bold">{`${Math.round(aggressive.annualRevenueMin / 1e6)}-${Math.round(aggressive.annualRevenueMax / 1e6)}M`}</div>
            <p className="text-sm text-muted-foreground">Annual revenue range</p>
            <div className="text-sm">
              <div>• {aggressive.minDealers.toLocaleString()}-{aggressive.maxDealers.toLocaleString()} dealerships</div>
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
                  <th className="border border-gray-300 p-2 text-left">Investment Required (CAC)</th>
                  <th className="border border-gray-300 p-2 text-left">Timeline</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Conservative</td>
                  <td className="border border-gray-300 p-2">5-10%</td>
                  <td className="border border-gray-300 p-2">{conservative.minDealers.toLocaleString()}-{conservative.maxDealers.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2">{`${formatCurrency(conservative.annualRevenueMin)} - ${formatCurrency(conservative.annualRevenueMax)}`}</td>
                  <td className="border border-gray-300 p-2">{`${formatCurrency(conservative.investMin)} - ${formatCurrency(conservative.investMax)}`}</td>
                  <td className="border border-gray-300 p-2">{conservative.timelineLabel}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Moderate</td>
                  <td className="border border-gray-300 p-2">15-20%</td>
                  <td className="border border-gray-300 p-2">{moderate.minDealers.toLocaleString()}-{moderate.maxDealers.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2">{`${formatCurrency(moderate.annualRevenueMin)} - ${formatCurrency(moderate.annualRevenueMax)}`}</td>
                  <td className="border border-gray-300 p-2">{`${formatCurrency(moderate.investMin)} - ${formatCurrency(moderate.investMax)}`}</td>
                  <td className="border border-gray-300 p-2">{moderate.timelineLabel}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Aggressive</td>
                  <td className="border border-gray-300 p-2">25-35%</td>
                  <td className="border border-gray-300 p-2">{aggressive.minDealers.toLocaleString()}-{aggressive.maxDealers.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2">{`${formatCurrency(aggressive.annualRevenueMin)} - ${formatCurrency(aggressive.annualRevenueMax)}`}</td>
                  <td className="border border-gray-300 p-2">{`${formatCurrency(aggressive.investMin)} - ${formatCurrency(aggressive.investMax)}`}</td>
                  <td className="border border-gray-300 p-2">{aggressive.timelineLabel}</td>
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
    </div>
  )
}

export default GrowthScenariosTab


