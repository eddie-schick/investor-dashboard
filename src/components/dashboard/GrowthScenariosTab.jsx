import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const GrowthScenariosTab = ({ penetrationScenarios }) => {
  return (
    <div className="space-y-6">
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
    </div>
  )
}

export default GrowthScenariosTab


