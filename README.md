# Commercial Truck Dealership Market - Investor Dashboard

An interactive React dashboard for exploring the commercial truck dealership market opportunity with adjustable assumptions and real-time financial projections.

## 🎯 Overview

This dashboard provides comprehensive analysis of the $224.65 billion commercial truck dealership industry, focusing on technology modernization opportunities including marketplace platforms, dealer websites, lead generation, and transaction fee models.

## 📊 Key Features

### Market Analysis
- **3,816 dealerships** with detailed financial breakdowns
- **$1.37B software market** opportunity analysis
- **$80.7B transaction volume** for digitization
- Real-time market size calculations

### Interactive Assumptions
- Market penetration scenarios (1-50%)
- Transaction fee rates (0.1-3.0%)
- SaaS pricing models ($299-$3,499/month)
- Customer acquisition and retention metrics

### Revenue Projections
- SaaS subscription revenue modeling
- Transaction fee calculations
- Dealer website and lead generation revenue
- Customer lifetime value analysis

### Growth Scenarios
- Conservative, moderate, and aggressive growth paths
- Investment requirements by scenario
- Market penetration impact analysis

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd investor-dashboard

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
# Build the application
pnpm run build

# Preview production build
pnpm run preview
```

## 📁 Project Structure

```
investor-dashboard/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   └── ui/            # shadcn/ui components
│   ├── App.jsx            # Main dashboard component
│   ├── App.css            # Styling and theme
│   └── main.jsx           # Application entry point
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## 🎛️ Dashboard Tabs

### 1. Market Overview
- Industry size and key metrics
- Market breakdown by category
- Department revenue analysis
- Critical pain points and opportunities

### 2. Adjust Assumptions
- Interactive sliders and inputs
- Real-time calculation updates
- Customer metrics (LTV, CAC, churn)
- Market penetration scenarios

### 3. Revenue Opportunity
- Total revenue projections
- Revenue source breakdown
- Market penetration impact
- Detailed model calculations

### 4. Growth Scenarios
- Conservative to aggressive scenarios
- Investment requirements
- Success factors analysis
- Market penetration charts

## 📈 Key Market Insights

### Major Opportunities
- **Used Truck Losses**: $552M annual industry loss ($3,288 per unit)
- **Time Inefficiency**: 20% of employee time wasted = $3.3B productivity loss
- **Software Fragmentation**: $360K annual spend per dealership on disconnected systems
- **Service Margins**: 38.2% gross margins in service department

### Market Validation
- **Total Addressable Market**: $3.4B+ across software, transactions, and services
- **Software Market**: $1.37B annually across 3,816 dealerships
- **Transaction Volume**: $80.7B in annual truck sales
- **Employment**: 239,345 total industry employees

## 🔧 Technology Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - UI component library
- **Recharts** - Data visualization
- **Lucide React** - Icons

## 📊 Data Sources

All market data is sourced from:
- **2023 ATD (American Truck Dealers) Report** - Primary industry data
- **Industry Research** - Software spending and efficiency studies
- **Market Analysis** - Competitive landscape and pricing data

## 🎨 Customization

### Adjusting Market Data
Update the `baseMarketData` object in `App.jsx` to modify core market assumptions:

```javascript
const baseMarketData = {
  totalDealerships: 3816,
  totalRevenue: 224.65e9,
  avgDealershipRevenue: 58.87e6,
  // ... other metrics
}
```

### Modifying Assumptions
Default assumptions can be changed in the `assumptions` state:

```javascript
const [assumptions, setAssumptions] = useState({
  marketPenetration: 15,
  transactionFeeRate: 0.75,
  saasBasePricing: 999,
  // ... other assumptions
})
```

### Styling
The dashboard uses Tailwind CSS with a custom theme defined in `App.css`. Colors and styling can be customized through CSS variables.

## 📱 Responsive Design

The dashboard is fully responsive and optimized for:
- Desktop computers (1920px+)
- Laptops (1024px+)
- Tablets (768px+)
- Mobile devices (320px+)

## 🔒 Security Considerations

- No sensitive data is stored in the application
- All calculations are performed client-side
- No external API calls or data transmission
- Static deployment friendly

## 📄 License

This project is provided for investment analysis purposes. Please ensure compliance with any applicable data usage restrictions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For questions about the market analysis or dashboard functionality, please refer to the data sources or create an issue in the repository.

## 🎯 Investment Scenarios

### Conservative (5-10% market share)
- **Revenue**: $25-50M annually
- **Customers**: 190-380 dealerships
- **Investment**: $30-50M
- **Timeline**: 3-5 years

### Moderate (15-20% market share)
- **Revenue**: $75-100M annually
- **Customers**: 570-760 dealerships
- **Investment**: $80-120M
- **Timeline**: 5-7 years

### Aggressive (25-35% market share)
- **Revenue**: $125-175M annually
- **Customers**: 950-1,335 dealerships
- **Investment**: $150-250M
- **Timeline**: 7-10 years

---

**Built with ❤️ for commercial truck dealership market analysis**

