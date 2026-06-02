# StockPro - Premium Stock Market Web App UI

A beautiful, professional stock market web application built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components. This is a **frontend-only** implementation with mock data - no backend integration.

## ✨ Features Built

### 1. **Design System**
- Premium dark/light mode theme with indigo primary color and accent colors
- Professional color palette inspired by trading platforms (CoinGecko-style)
- Responsive design that works perfectly on mobile, tablet, and desktop
- Smooth transitions and hover effects throughout
- Semantic design tokens for consistency

### 2. **Navigation**
- Sticky navbar with theme toggle
- Mobile-responsive hamburger menu
- Quick links to all major sections
- Branding with StockPro logo
- Sign in/Sign up buttons

### 3. **Home Page** (`/`)
- Market overview with key metrics (S&P 500, Nasdaq, Russell 2000, etc.)
- Top gainers section with trending up stocks
- Top losers section with trending down stocks
- Latest market news preview (4 articles)
- CTA section to encourage account creation

### 4. **Markets Page** (`/markets`)
- Advanced data-dense table with 8 stocks
- Real-time search by symbol or company name
- Multiple sort options (price, change, market cap)
- Ascending/descending sort toggle
- Sortable column headers
- Responsive table that works on mobile
- Volume and market cap data
- 52-week high prices

### 5. **Stock Detail Page** (`/stock/[symbol]`)
- Dynamic routing based on stock symbol
- Large price display with color-coded changes
- TradingView chart placeholder area
- Timeframe selector (1D, 5D, 1M, 3M, 6M, 1Y, All)
- Key metrics grid (Price, Market Cap, Volume, P/E Ratio)
- 52-week range visualization with progress bar
- Company information section
- Link back to markets table

### 6. **News Section** (`/news`)
- News grid with card layout (3 columns on desktop, responsive)
- Category filter tabs (All, Earnings, Market News, Analysis, News)
- Search functionality across news articles
- News cards with title, description, category badge, and timestamp
- Filtered/sorted news display

### 7. **News Detail Page** (`/news/[id]`)
- Full article layout with headline and metadata
- Article category badge
- Time ago display
- Share and Save action buttons
- Full article content with rich formatting
- Related articles section
- Back button for navigation

### 8. **User Dashboard** (`/dashboard`)
- Personalized user greeting
- Portfolio summary cards:
  - Total portfolio value (with toggle to show/hide)
  - Day's change with percentage
  - Quick action buttons (Buy/Sell)
- Holdings tab with stock cards
- Watchlist tab with watched stocks
- Portfolio metrics section (largest gains/losses, YTD return, benchmark)
- Latest news widget
- Settings and logout buttons
- Responsive design for all screen sizes

### 9. **AI Agent Page** (`/ai-agent`)
- Beautiful chat interface
- Message history with user/assistant differentiation
- Real-time message timestamps
- AI response simulation with random relevant responses
- Suggested action cards (Analyze Portfolio, Market Trends)
- Input field with send button
- Loading indicator during responses
- Scrolls to latest message automatically
- Disclaimer for demo purposes

### 10. **Authentication Pages**
- **Login Page** (`/login`)
  - Email and password fields
  - Remember me checkbox
  - Forgot password link
  - Show/hide password toggle
  - Social login options (Google, Apple)
  - Sign up link for new users
  - Split layout with branding on desktop
  
- **Register Page** (`/register`)
  - Full name, email, password, confirm password fields
  - Password strength indicator text
  - Terms and conditions acceptance
  - Social signup options
  - Split layout matching login page
  - Link to sign in page

## 📊 Data & Components

### Mock Data Includes:
- 8 major stocks (AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, BRK.B)
- Stock data: price, change, change percentage, market cap, volume, P/E ratio, 52-week high/low
- 5 market news articles with full details
- 6 market metrics (S&P 500, Nasdaq, Dow Jones, Russell 2000, VIX, Treasury 10Y)
- Sample user portfolio with holdings and watchlist

### Reusable Components:
- **Navbar**: Responsive navigation with theme toggle
- **StockCard**: Individual stock display with trends
- **MarketMetric**: Key metric display cards
- **NewsCard**: News article preview cards
- **Providers**: Next.js theme provider wrapper

## 🎨 Design Highlights

- **Color System**: 
  - Primary: Deep indigo (oklch(0.35 0.15 280))
  - Accent: Vibrant indigo (oklch(0.52 0.22 260))
  - Backgrounds: Light mode: cream (oklch(0.99 0 0)), Dark mode: charcoal (oklch(0.12 0 0))
  - Semantic tokens for consistency

- **Typography**:
  - Geist Sans for body text
  - Geist Mono for code
  - Clear hierarchy with consistent sizing

- **Spacing**: 
  - Uses Tailwind spacing scale for consistency
  - Gap classes for component separation
  - Padding and margin follow design system

- **Interactions**:
  - Smooth hover states on all interactive elements
  - Color-coded gains (emerald) and losses (red)
  - Loading states with spinners
  - Responsive touch targets for mobile

## 🛠️ Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Theme**: next-themes for dark/light mode
- **Icons**: lucide-react
- **State**: React hooks (useState, useMemo)
- **Routing**: Next.js dynamic routes with [symbol] and [id]

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), lg (1024px)
- Tables switch to card layout on mobile
- Hamburger menu for navigation on mobile
- Touch-friendly buttons and inputs
- Readable font sizes across all devices

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

The app will be available at `http://localhost:3000`

## 📄 Pages & Routes

- `/` - Home page with market overview
- `/markets` - Advanced stock market table
- `/stock/[symbol]` - Individual stock details
- `/news` - News listing with filters
- `/news/[id]` - News article detail
- `/dashboard` - User portfolio dashboard
- `/ai-agent` - AI market analyst chat
- `/login` - User login
- `/register` - User registration

## 🎯 Key Features

✅ Beautiful, professional UI design  
✅ Responsive on all screen sizes  
✅ Dark/light mode support  
✅ Mock data with realistic numbers  
✅ Advanced data table with sorting and filtering  
✅ Dynamic routing for stocks and articles  
✅ AI agent chat interface  
✅ Portfolio tracking dashboard  
✅ User authentication flows  
✅ Real-time search and filtering  
✅ Color-coded financial data  
✅ Smooth animations and transitions  

## 📝 Notes

- This is a **frontend-only** implementation with no backend
- All data is mocked and stored in `/lib/mock-data.ts`
- Authentication pages are UI mockups (no actual authentication)
- Chat responses are simulated
- Ready to integrate with real backend APIs
- Uses semantic HTML and ARIA attributes for accessibility
