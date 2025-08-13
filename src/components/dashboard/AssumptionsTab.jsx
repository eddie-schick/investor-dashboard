import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatters'
import { Calendar, Info } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'

const AssumptionsTab = ({ assumptions, updateAssumption, marketOpportunity, baseMarketData }) => {
  const [implementationsOpen, setImplementationsOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  // Persist last selected sub-tab within Model Assumptions
  const [activeAssumptionsSubtab, setActiveAssumptionsSubtab] = useState(() => {
    try {
      return localStorage.getItem('assumptions.activeSubtab') || 'revenue'
    } catch {
      return 'revenue'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('assumptions.activeSubtab', activeAssumptionsSubtab)
    } catch {}
  }, [activeAssumptionsSubtab])
  const [rampPace, setRampPace] = useState(10) // slider value 0.5..20.5, default 10x
  const [rampStartIndex, setRampStartIndex] = useState(1) // default Sep 2025
  const [detailsOpenKey, setDetailsOpenKey] = useState(null)
  // Bulk expense ramp UI state
  const expenseKeys = [
    'expensePayroll',
    'expenseContractors',
    'expenseTravelMarketing',
    'expenseLicenseFees',
    'expenseSharedServices',
    'expenseLegal',
    'expenseCompanyVehicle',
    'expenseInsurance',
    'expenseContingencies',
    'expenseConsultantAudit',
  ]
  const [selectedExpenseKeys, setSelectedExpenseKeys] = useState(expenseKeys)
  const [bulkPct, setBulkPct] = useState(2)
  // Default to Jun 2026. scheduleMonths starts Aug 2025; Jun 2026 index = 10
  const [bulkStartMonth, setBulkStartMonth] = useState(10)
  const [expenseRampOpen, setExpenseRampOpen] = useState(false)

  // Months used across the financial model (Aug 2025 - Dec 2027)
  const scheduleMonths = useMemo(() => {
    const result = []
    const startMonth = 7 // August (0-indexed)
    const startYear = 2025
    const endMonth = 11 // December
    const endYear = 2027
    for (let y = startYear; y <= endYear; y++) {
      const mStart = y === startYear ? startMonth : 0
      const mEnd = y === endYear ? endMonth : 11
      for (let m = mStart; m <= mEnd; m++) {
        result.push({
          month: m,
          year: y,
          label: new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        })
      }
    }
    return result
  }, [])

  const InfoDialog = ({ title, children }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1 align-middle opacity-70 hover:opacity-100">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">About {title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-2">{children}</div>
      </DialogContent>
    </Dialog>
  )

  const MonthlyControls = ({ assumptionKey, unit }) => {
    const ramp = assumptions.ramps?.[assumptionKey] || { enabled: false, monthlyPercent: 0 }
    const overrides = assumptions.monthlyOverrides?.[assumptionKey] || []

    const setRamp = (patch) => {
      const next = { ...(assumptions.ramps || {}), [assumptionKey]: { ...ramp, ...patch } }
      updateAssumption('ramps', next)
    }
    const setOverrideAt = (idx, val) => {
      const len = scheduleMonths.length
      const current = Array.from({ length: len }, (_, i) => (overrides?.[i] ?? ''))
      current[idx] = val
      const next = { ...(assumptions.monthlyOverrides || {}), [assumptionKey]: current.map((v) => (v === '' ? undefined : Number(v))) }
      updateAssumption('monthlyOverrides', next)
    }
    const clearOverrides = () => {
      const next = { ...(assumptions.monthlyOverrides || {}) }
      delete next[assumptionKey]
      updateAssumption('monthlyOverrides', next)
    }

    return (
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Switch checked={!!ramp.enabled} onCheckedChange={(v) => setRamp({ enabled: v })} />
          <span>Monthly increase</span>
          <input
            type="number"
            className="w-16 border rounded px-2 py-1 ml-1"
            step={0.1}
            value={ramp.monthlyPercent ?? 0}
            onChange={(e) => setRamp({ monthlyPercent: parseFloat(e.target.value || '0') })}
          />
          <span>%</span>
        </div>
        <div className="flex items-center gap-2">
          {overrides && overrides.filter((v) => typeof v === 'number').length > 0 && (
            <button className="underline hover:no-underline" onClick={clearOverrides}>Clear overrides</button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDetailsOpenKey(assumptionKey)}>Monthly Override</Button>
        </div>
        <Dialog open={detailsOpenKey === assumptionKey} onOpenChange={(o) => setDetailsOpenKey(o ? assumptionKey : null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Monthly Override</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">Set per-month overrides. Leave blank to use the current slider value for that month.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                {scheduleMonths.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 border rounded p-2">
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                    <input
                      type="number"
                      className="w-24 border rounded px-2 py-1 text-sm"
                      value={overrides?.[idx] ?? ''}
                      placeholder={String(assumptions?.[assumptionKey] ?? '')}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === '') setOverrideAt(idx, '')
                        else setOverrideAt(idx, Number(raw))
                      }}
                    />
                    <span className="text-xs">{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Map slider pace to exponent preserving old behavior up to 10x, then continuing to 20x.
  // - <=10x matches previous mapping: 0.5x -> 8 (very back-loaded), 10x -> 0.5 (fast ramp)
  // - 20.5 => even (exponent 0); between 10..20 decreases from 0.5 toward 0
  const mapPaceToExponent = (pace) => {
    if (pace >= 20.5) return 0
    const clamped = Math.min(Math.max(pace, 0.5), 20)
    if (clamped <= 10) {
      const inner = Math.min(Math.max(clamped, 0.5), 10)
      return Math.max(0.5, Math.min(8, ((10.5 - inner) / 10) * 8))
    }
    // For 10..20x, linearly decrease exponent from 0.5 at 10x to ~0 approaching 20.5x
    const fraction = (20.5 - clamped) / (20.5 - 10) // 1.0 at 10x, 0 at 20.5x
    return Math.max(0, 0.5 * fraction)
  }

  // Helper to build a ramp plan with given pace and start month index
  const buildRampPlan = (pace, startIndex) => {
    const months = scheduleMonths.length
    const target = Math.round((baseMarketData.totalDealerships || 3816) * (assumptions.marketPenetration / 100))
    if (months <= 0 || target <= 0) return Array.from({ length: months }, () => 0)
    const effectiveStart = Math.min(Math.max(0, startIndex || 0), months - 1)
    const activeMonths = Math.max(1, months - effectiveStart)
    const exponent = mapPaceToExponent(pace)
    const weights = Array.from({ length: activeMonths }, (_, i) => Math.pow(i + 1, exponent))
    const sum = weights.reduce((s, w) => s + w, 0)
    let alloc = weights.map((w) => Math.round((w / sum) * target))
    let diff = target - alloc.reduce((s, v) => s + v, 0)
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

  // Always keep onboarding plan in sync with current settings so the Income Statement
  // reflects it by default without opening the popout.
  useEffect(() => {
    if (!assumptions.useOnboardingPlan) return
    const nextPlan = buildRampPlan(rampPace, rampStartIndex)
    const currentPlan = assumptions.onboardingPlan || []
    const isDifferent =
      nextPlan.length !== currentPlan.length ||
      nextPlan.some((value, index) => value !== (currentPlan[index] ?? 0))
    if (isDifferent) {
      updateAssumption('onboardingPlan', nextPlan)
    }
  }, [assumptions.useOnboardingPlan, assumptions.marketPenetration, rampPace, rampStartIndex, scheduleMonths.length, baseMarketData.totalDealerships])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Assumptions</CardTitle>
          <CardDescription>Modify these assumptions to see how they impact the financial projections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeAssumptionsSubtab} onValueChange={setActiveAssumptionsSubtab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="metrics">Customer Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="revenue" className="space-y-4">
              {/* Revenue sections collapsed by default */}
              <Accordion
                type="multiple"
                defaultValue={["marketplace", "transactional", "implementation", "maintenance"]}
                className="w-full"
              >
                {/* Subscription Revenue (formerly Marketplace Revenue) */}
                <AccordionItem value="marketplace">
                  <AccordionTrigger className="text-lg font-semibold text-blue-600">Subscription Revenue</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="marketPenetration">Dealer Penetration (%)</Label>
                <InfoDialog title="Market Penetration">
                  Percentage of total dealerships targeted by the model. Drives the number of customers used to compute SaaS, transactions, websites, and lead-gen revenue.
                </InfoDialog>
              </div>
              <Slider
                id="marketPenetration"
                min={0}
                max={50}
                step={1}
                value={[assumptions.marketPenetration]}
                onValueChange={(value) => updateAssumption('marketPenetration', value[0])}
              />
                        <div className="text-sm text-muted-foreground">
                          {assumptions.marketPenetration}% = {Math.round(baseMarketData.totalDealerships * assumptions.marketPenetration / 100).toLocaleString()} dealerships
            </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch checked={!!assumptions.useOnboardingPlan} onCheckedChange={(v)=>updateAssumption('useOnboardingPlan', v)} />
                  <span>Use dealer onboarding plan</span>
                </div>
                <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">Dealer Onboarding</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                     <DialogHeader>
                       <DialogTitle>Dealer Onboarding</DialogTitle>
                     </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>Onboard Velocity</span>
                          <div className="w-56">
                            <Slider min={0.5} max={20.5} step={0.5} value={[rampPace]} onValueChange={(v)=>{ const p=v[0]; setRampPace(p); const plan = buildRampPlan(p, rampStartIndex); updateAssumption('onboardingPlan', plan) }} />
                          </div>
                          <span>{rampPace >= 20.5 ? 'Even' : `${rampPace.toFixed(1)}x`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Start month</span>
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={rampStartIndex}
                            onChange={(e)=>{ const idx = parseInt(e.target.value,10); setRampStartIndex(idx); const plan = buildRampPlan(rampPace, idx); updateAssumption('onboardingPlan', plan) }}
                          >
                            {scheduleMonths.map((m, idx) => (
                              <option key={idx} value={idx}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                        {scheduleMonths.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 border rounded p-2">
                            <span className="text-xs text-muted-foreground">{m.label}</span>
                            <input
                              type="number"
                              min="0"
                              className="w-20 border rounded px-2 py-1 text-sm"
                              value={(assumptions.onboardingPlan?.[idx] ?? 0)}
                              onChange={(e) => {
                                const plan = Array.from({ length: scheduleMonths.length }, (_, j) => assumptions.onboardingPlan?.[j] ?? 0)
                                plan[idx] = Math.max(0, parseInt(e.target.value || '0', 10))
                                updateAssumption('onboardingPlan', plan)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            
                      
                      <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="saasBasePricing">SaaS Base Price ($/month)</Label>
                <InfoDialog title="SaaS Base Price">
                  Monthly subscription price per customer. Subscription revenue is calculated as customers × price.
                </InfoDialog>
              </div>
                        <Slider
                          id="saasBasePricing"
                          min={0}
                          max={20000}
                          step={25}
                          value={[assumptions.saasBasePricing]}
                          onValueChange={(value) => updateAssumption('saasBasePricing', value[0])}
                        />
                        <div className="text-sm text-muted-foreground">
                          ${assumptions.saasBasePricing.toLocaleString()} per month • ${(assumptions.saasBasePricing * 12).toLocaleString()} per year
                        </div>
                        <MonthlyControls assumptionKey="saasBasePricing" unit="$" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="dealerWebsiteCost">Dealer Website ($/month)</Label>
                <InfoDialog title="Dealer Website">
                  Monthly fee per customer for hosted dealer websites. Annualized as customers × monthly fee × 12.
                </InfoDialog>
              </div>
              <Slider
                id="dealerWebsiteCost"
                min={0}
                max={10000}
                step={25}
                value={[assumptions.dealerWebsiteCost]}
                onValueChange={(value) => updateAssumption('dealerWebsiteCost', value[0])}
              />
                        <div className="text-sm text-muted-foreground">
                          ${assumptions.dealerWebsiteCost.toLocaleString()} per month • ${(assumptions.dealerWebsiteCost * 12).toLocaleString()} per year
            </div>
                        <MonthlyControls assumptionKey="dealerWebsiteCost" unit="$" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="annualChurnRate">Annual Churn Rate (%)</Label>
                <InfoDialog title="Annual Churn Rate">
                  Percent of customers lost per year. Applied monthly to reduce active customers over time.
                </InfoDialog>
              </div>
              <Slider
                id="annualChurnRate"
                min={0}
                max={30}
                step={1}
                value={[assumptions.annualChurnRate]}
                onValueChange={(value) => updateAssumption('annualChurnRate', value[0])}
              />
                        <div className="text-sm text-muted-foreground">
                          {assumptions.annualChurnRate}% customers leave annually
                        </div>
                        <MonthlyControls assumptionKey="annualChurnRate" unit="%" />
                      </div>
                      
                      

                      

                      
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Transactional Revenue */}
                <AccordionItem value="transactional">
                  <AccordionTrigger className="text-lg font-semibold text-blue-600">Transactional Revenue</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="transactionFeeRate">Transaction Fee Rate (%)</Label>
                          <InfoDialog title="Transaction Fee Rate">
                            Percentage fee applied to each transaction processed through the marketplace.
                          </InfoDialog>
                        </div>
                        <Slider
                          id="transactionFeeRate"
                          min={0}
                          max={3.0}
                          step={0.1}
                          value={[assumptions.transactionFeeRate]}
                          onValueChange={(value) => updateAssumption('transactionFeeRate', value[0])}
                        />
                        <div className="text-sm text-muted-foreground">
                          {assumptions.transactionFeeRate}% per transaction
                        </div>
                        <MonthlyControls assumptionKey="transactionFeeRate" unit="%" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="transactionsPerCustomer">Transactions per Customer (yearly)</Label>
                          <InfoDialog title="Transactions per Customer">
                            Estimated number of transactions per customer per year. Drives transaction fee revenue.
                          </InfoDialog>
                        </div>
                        <Slider
                          id="transactionsPerCustomer"
                          min={0}
                          max={400}
                          step={1}
                          value={[assumptions.transactionsPerCustomer || 168]}
                          onValueChange={(value) => updateAssumption('transactionsPerCustomer', value[0])}
                        />
                        <div className="text-sm text-muted-foreground">
                          {assumptions.transactionsPerCustomer || 168} estimated transactions per year
                        </div>
                        <MonthlyControls assumptionKey="transactionsPerCustomer" unit="/yr" />
                      </div>
                      
                       <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="avgTransactionPrice">Average Transaction Price ($)</Label>
                          <InfoDialog title="Average Transaction Price">
                            Average dollar value per transaction. Multiplied by transactions and fee rate to compute revenue.
                          </InfoDialog>
                        </div>
                        <Slider
                          id="avgTransactionPrice"
                          min={0}
                          max={300000}
                          step={1000}
                          value={[assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice]}
                          onValueChange={(value) => updateAssumption('avgTransactionPrice', value[0])}
                        />
                        <div className="text-sm text-muted-foreground">
                          ${(assumptions.avgTransactionPrice || baseMarketData.avgTruckPrice).toLocaleString()} per transaction
                        </div>
                        <MonthlyControls assumptionKey="avgTransactionPrice" unit="$" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Implementation Revenue */}
                <AccordionItem value="implementation">
                  <AccordionTrigger className="text-lg font-semibold text-blue-600">Implementation Revenue</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label>Implementation Engagements</Label>
                          <InfoDialog title="Implementation Schedule">
                            Number of implementation projects per month. Each project generates implementation revenue and later maintenance.
                          </InfoDialog>
                        </div>
                        <Dialog open={implementationsOpen} onOpenChange={setImplementationsOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full flex justify-between items-center">
                              <span>Monthly Assumptions</span>
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Implementation Schedule (per month)</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-2">
                              <p className="text-sm text-muted-foreground">Enter number of implementations per month. Default is 0 for all months.</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                                {scheduleMonths.map((m, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 border rounded p-2">
                                    <span className="text-xs text-muted-foreground">{m.label}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      className="w-20 border rounded px-2 py-1 text-sm"
                                      value={(assumptions.implementationPlan?.[idx] ?? 0)}
                                      onChange={(e) => {
                                        const plan = Array.from({ length: scheduleMonths.length }, (_, j) => assumptions.implementationPlan?.[j] ?? 0)
                                        plan[idx] = Math.max(0, parseInt(e.target.value || '0', 10))
                                        updateAssumption('implementationPlan', plan)
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                      </div>
                      
                       <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="implementationPrice">Implementation Price ($)</Label>
                          <InfoDialog title="Implementation Price">
                            Revenue recognized per implementation project in the month it occurs.
                          </InfoDialog>
                        </div>
                        <Slider
                          id="implementationPrice"
                          min={0}
                          max={1000000}
                          step={10000}
                          value={[assumptions.implementationPrice || 500000]}
                          onValueChange={(value) => updateAssumption('implementationPrice', value[0])}
                        />
                        <div className="text-sm text-muted-foreground">
                           ${(assumptions.implementationPrice || 500000).toLocaleString()} per implementation
                        </div>
                        <MonthlyControls assumptionKey="implementationPrice" unit="$" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="contractorsSpikePercentage">Contractors Spike (%)</Label>
                          <InfoDialog title="Contractors Spike">
                            Additional contractor expense expressed as a percentage of implementation revenue during months with implementations.
                          </InfoDialog>
                        </div>
                        <Slider
                          id="contractorsSpikePercentage"
                          min={0}
                          max={60}
                          step={5}
                           value={[assumptions.contractorsSpikePercentage ?? 0]}
                          onValueChange={(value) => updateAssumption('contractorsSpikePercentage', value[0])}
                        />
                        <div className="text-sm text-muted-foreground">
                           {(assumptions.contractorsSpikePercentage ?? 0)}% of implementation cost
                        </div>
                        <MonthlyControls assumptionKey="contractorsSpikePercentage" unit="%" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Maintenance Revenue */}
                <AccordionItem value="maintenance">
                  <AccordionTrigger className="text-lg font-semibold text-blue-600">Maintenance Revenue</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="maintenancePercentage">Maintenance Percentage (%)</Label>
                          <InfoDialog title="Maintenance Percentage">
                            Annual maintenance revenue as a percent of implementation revenue, starting after a delay and recognized monthly.
                          </InfoDialog>
                        </div>
                        <Slider
                          id="maintenancePercentage"
                          min={0}
                          max={25}
                          step={1}
                          value={[assumptions.maintenancePercentage || 18]}
                          onValueChange={(value) => updateAssumption('maintenancePercentage', value[0])}
                        />
                        <div className="text-sm text-muted-foreground">
                          {(assumptions.maintenancePercentage || 18)}% of implementation revenue
                        </div>
                        <MonthlyControls assumptionKey="maintenancePercentage" unit="%" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="maintenanceStartMonth">Start After (months)</Label>
                          <InfoDialog title="Maintenance Start Delay">
                            Number of months after an implementation before maintenance revenue begins.
                          </InfoDialog>
                        </div>
                        <Slider
                          id="maintenanceStartMonth"
                          min={0}
                          max={6}
                          step={1}
                          value={[assumptions.maintenanceStartMonth || 3]}
                          onValueChange={(value) => updateAssumption('maintenanceStartMonth', value[0])}
                        />
                        <div className="text-sm text-muted-foreground">
                          Starts {(assumptions.maintenanceStartMonth || 3)} months after implementation
                        </div>
                        <MonthlyControls assumptionKey="maintenanceStartMonth" unit="mo" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="expenses" className="space-y-4">
              {/* Bulk expense ramp controls */}
              <Collapsible open={expenseRampOpen} onOpenChange={setExpenseRampOpen}>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Expense Ramp Controls</CardTitle>
                        <CardDescription>Select expense categories to ramp by a monthly percent starting from a chosen month.</CardDescription>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm">{expenseRampOpen ? 'Hide' : 'Show'}</Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-3 items-center">
                    {expenseKeys.map((key) => {
                      const labelMap = {
                        expensePayroll: 'Payroll',
                        expenseContractors: 'Contractors',
                        expenseTravelMarketing: 'Travel & Marketing',
                        expenseLicenseFees: 'License Fees',
                        expenseSharedServices: 'Shared Services',
                        expenseLegal: 'Legal',
                        expenseCompanyVehicle: 'Company Vehicle',
                        expenseInsurance: 'Insurance',
                        expenseContingencies: 'Contingencies',
                        expenseConsultantAudit: 'Consultants/Audit/Tax',
                      }
                      const checked = selectedExpenseKeys.includes(key)
                      return (
                        <label key={key} className="flex items-center gap-2 border rounded px-2 py-1 text-sm">
                          <Checkbox checked={checked} onCheckedChange={(v) => {
                            setSelectedExpenseKeys((prev) => {
                              const exists = prev.includes(key)
                              if (v && !exists) return [...prev, key]
                              if (!v && exists) return prev.filter(k => k !== key)
                              return prev
                            })
                          }} />
                          <span>{labelMap[key]}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span>% increase per month</span>
                      <input
                        type="number"
                        className="w-20 border rounded px-2 py-1"
                        step={0.1}
                        value={bulkPct}
                        onChange={(e) => setBulkPct(parseFloat(e.target.value || '0'))}
                      />
                      <span>%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Start month</span>
                      <select
                        className="border rounded px-2 py-1"
                        value={bulkStartMonth}
                        onChange={(e) => setBulkStartMonth(parseInt(e.target.value, 10))}
                      >
                        {scheduleMonths.map((m, idx) => (
                          <option key={idx} value={idx}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedExpenseKeys(expenseKeys)}>Select All</Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedExpenseKeys([])}>Unselect All</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      // Disable all expense ramps and clear selection
                      const next = { ...(assumptions.ramps || {}) }
                      expenseKeys.forEach(k => { delete next[k] })
                      updateAssumption('ramps', next)
                      setSelectedExpenseKeys([])
                    }}>Clear All</Button>
                    <Button variant="default" size="sm" onClick={() => {
                      const next = { ...(assumptions.ramps || {}) }
                      const targets = selectedExpenseKeys.length > 0 ? selectedExpenseKeys : expenseKeys
                      targets.forEach(k => {
                        next[k] = { enabled: true, monthlyPercent: bulkPct, startMonth: bulkStartMonth }
                      })
                      updateAssumption('ramps', next)
                    }}>Apply Changes</Button>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Expense sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payroll */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expensePayroll">Payroll ($/month)</Label>
                    <InfoDialog title="Payroll">
                      Monthly payroll expense.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expensePayroll"
                    min={0}
                    max={300000}
                    step={1000}
                    value={[assumptions.expensePayroll || 110000]}
                    onValueChange={(value) => updateAssumption('expensePayroll', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expensePayroll || 110000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expensePayroll" unit="$" />
                </div>
                
                {/* Contractors */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseContractors">Contractors ($/month)</Label>
                    <InfoDialog title="Contractors">
                      Base monthly contractor expense; note there is an additional spike tied to implementation months.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseContractors"
                    min={0}
                    max={200000}
                    step={1000}
                    value={[assumptions.expenseContractors || 50000]}
                    onValueChange={(value) => updateAssumption('expenseContractors', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseContractors || 50000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseContractors" unit="$" />
                </div>
                
                {/* Travel and Marketing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseTravelMarketing">Travel and Marketing ($/month)</Label>
                    <InfoDialog title="Travel and Marketing">
                      Recurring monthly spend for travel and marketing activities.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseTravelMarketing"
                    min={0}
                    max={100000}
                    step={1000}
                    value={[assumptions.expenseTravelMarketing || 30000]}
                    onValueChange={(value) => updateAssumption('expenseTravelMarketing', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseTravelMarketing || 30000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseTravelMarketing" unit="$" />
                </div>
                
                {/* License Fees */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseLicenseFees">License Fees ($/month)</Label>
                    <InfoDialog title="License Fees">
                      Software and platform licensing costs per month.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseLicenseFees"
                    min={0}
                    max={50000}
                    step={500}
                    value={[assumptions.expenseLicenseFees || 15000]}
                    onValueChange={(value) => updateAssumption('expenseLicenseFees', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseLicenseFees || 15000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseLicenseFees" unit="$" />
                </div>
                
                {/* Shared Services */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseSharedServices">Shared Services ($/month)</Label>
                    <InfoDialog title="Shared Services">
                      Centralized operations costs (e.g., HR, finance) allocated monthly.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseSharedServices"
                    min={0}
                    max={50000}
                    step={500}
                    value={[assumptions.expenseSharedServices || 18000]}
                    onValueChange={(value) => updateAssumption('expenseSharedServices', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseSharedServices || 18000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseSharedServices" unit="$" />
                </div>
                
                {/* Legal */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseLegal">Legal ($/month)</Label>
                    <InfoDialog title="Legal">
                      Ongoing legal and compliance expenses per month.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseLegal"
                    min={0}
                    max={50000}
                    step={500}
                    value={[assumptions.expenseLegal || 10000]}
                    onValueChange={(value) => updateAssumption('expenseLegal', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseLegal || 10000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseLegal" unit="$" />
                </div>
                
                {/* Company Vehicle */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseCompanyVehicle">Company Vehicle ($/month)</Label>
                    <InfoDialog title="Company Vehicle">
                      Lease, fuel, and maintenance costs for company vehicles per month.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseCompanyVehicle"
                    min={0}
                    max={20000}
                    step={250}
                    value={[assumptions.expenseCompanyVehicle || 6000]}
                    onValueChange={(value) => updateAssumption('expenseCompanyVehicle', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseCompanyVehicle || 6000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseCompanyVehicle" unit="$" />
                </div>
                
                {/* Insurance */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseInsurance">Insurance ($/month)</Label>
                    <InfoDialog title="Insurance">
                      Monthly insurance premiums.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseInsurance"
                    min={0}
                    max={20000}
                    step={250}
                    value={[assumptions.expenseInsurance || 5000]}
                    onValueChange={(value) => updateAssumption('expenseInsurance', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseInsurance || 5000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseInsurance" unit="$" />
                </div>
                
                {/* Contingencies */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseContingencies">Contingencies ($/month)</Label>
                    <InfoDialog title="Contingencies">
                      Buffer for unexpected costs.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseContingencies"
                    min={0}
                    max={20000}
                    step={250}
                    value={[assumptions.expenseContingencies || 5000]}
                    onValueChange={(value) => updateAssumption('expenseContingencies', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseContingencies || 5000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseContingencies" unit="$" />
                </div>
                
                {/* Consultant/Audit/Tax */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="expenseConsultantAudit">Consultants/Audit/Tax ($/month)</Label>
                    <InfoDialog title="Consultants/Audit/Tax">
                      Professional services and audit/tax fees per month.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="expenseConsultantAudit"
                    min={0}
                    max={20000}
                    step={250}
                    value={[assumptions.expenseConsultantAudit || 2000]}
                    onValueChange={(value) => updateAssumption('expenseConsultantAudit', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${((assumptions.expenseConsultantAudit || 2000)).toLocaleString()} per month
                  </div>
                  <MonthlyControls assumptionKey="expenseConsultantAudit" unit="$" />
                </div>
              </div>

            </TabsContent>

            {/* Customer Metrics Tab */}
            <TabsContent value="metrics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="customerAcquisitionCost">Customer Acquisition Cost ($)</Label>
                    <InfoDialog title="Customer Acquisition Cost (CAC)">
                      Average spend to acquire one customer. Used for LTV/CAC and payback period calculations.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="customerAcquisitionCost"
                    min={0}
                    max={100000}
                    step={500}
                    value={[assumptions.customerAcquisitionCost]}
                    onValueChange={(value) => updateAssumption('customerAcquisitionCost', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    ${assumptions.customerAcquisitionCost.toLocaleString()} per customer
                  </div>
                  <MonthlyControls assumptionKey="customerAcquisitionCost" unit="$" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="customerLifetimeYears">Customer Lifetime (years)</Label>
                    <InfoDialog title="Customer Lifetime">
                      Average retention in years for LTV. LTV includes SaaS and transaction revenue across this period.
                    </InfoDialog>
                  </div>
                  <Slider
                    id="customerLifetimeYears"
                    min={0}
                    max={15}
                    step={1}
                    value={[assumptions.customerLifetimeYears]}
                    onValueChange={(value) => updateAssumption('customerLifetimeYears', value[0])}
                  />
                  <div className="text-sm text-muted-foreground">
                    {assumptions.customerLifetimeYears} years average retention
                  </div>
                  <MonthlyControls assumptionKey="customerLifetimeYears" unit="yrs" />
                </div>
              </div>

              {/* KPI cards under the sliders */}
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
            </TabsContent>
          </Tabs>

          <Separator />
        </CardContent>
      </Card>
    </div>
  )
}

export default AssumptionsTab