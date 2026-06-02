# Integration Guide - Adding Backend Services

This document outlines how to extend StockPro with real backend integrations.

## 1. Database Integration (Supabase or Neon)

### Setup
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Tables to Create
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio holdings
CREATE TABLE holdings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  symbol TEXT,
  quantity DECIMAL,
  purchase_price DECIMAL,
  purchase_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Watchlist
CREATE TABLE watchlist (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  symbol TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users UNIQUE,
  theme TEXT DEFAULT 'system',
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 2. Authentication Integration

### Replace Mock Login with Real Auth
```typescript
// app/login/page.tsx
'use client'

import { signInWithPassword } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  
  const handleSubmit = async (formData: FormData) => {
    const { error } = await signInWithPassword({
      email: formData.get('email'),
      password: formData.get('password'),
    })
    
    if (!error) {
      router.push('/dashboard')
    }
  }
  
  // ... rest of component
}
```

### Create Auth Middleware
```typescript
// middleware.ts
import { updateSession } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: Request) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## 3. Real Stock Data API Integration

### CoinGecko API (Free, No Key Required)
```typescript
// lib/stock-api.ts
export async function getStockData(symbol: string) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}`
  )
  return response.json()
}
```

### Alpha Vantage API (Stocks)
```typescript
export async function getStockQuote(symbol: string) {
  const response = await fetch(
    `https://www.alphavantage.co/query?` +
    `function=GLOBAL_QUOTE&` +
    `symbol=${symbol}&` +
    `apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
  )
  return response.json()
}
```

### Replace Mock Data with Real API
```typescript
// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getStockData } from '@/lib/stock-api'

export default function Home() {
  const [stocks, setStocks] = useState([])
  
  useEffect(() => {
    async function fetchStocks() {
      const data = await Promise.all(
        ['AAPL', 'MSFT', 'GOOGL'].map(getStockData)
      )
      setStocks(data)
    }
    fetchStocks()
  }, [])
  
  // ... rest of component
}
```

## 4. Real News Integration

### NewsAPI Integration
```typescript
// lib/news-api.ts
export async function getMarketNews() {
  const response = await fetch(
    `https://newsapi.org/v2/everything?` +
    `q=stock+market&` +
    `sortBy=publishedAt&` +
    `apiKey=${process.env.NEWS_API_KEY}`
  )
  return response.json()
}
```

## 5. Charts Integration (TradingView)

### Lightweight Charts
```typescript
// app/stock/[symbol]/chart.tsx
'use client'

import { createChart } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

export function StockChart({ data }) {
  const containerRef = useRef(null)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
    })
    
    const lineSeries = chart.addLineSeries()
    lineSeries.setData(data)
    chart.timeScale().fitContent()
    
    return () => chart.remove()
  }, [data])
  
  return <div ref={containerRef} />
}
```

## 6. AI Agent Integration

### OpenAI / Claude Integration
```typescript
// app/api/chat/route.ts
import { openai } from '@/lib/openai'

export async function POST(request: Request) {
  const { messages } = await request.json()
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a financial advisor specializing in stock market analysis.',
      },
      ...messages,
    ],
  })
  
  return Response.json(response)
}
```

### Update Chat Component
```typescript
// app/ai-agent/page.tsx
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ messages }),
})

const data = await response.json()
const assistantMessage = data.choices[0].message.content
```

## 7. Portfolio Management

### Save Holdings to Database
```typescript
// app/api/portfolio/holdings/route.ts
export async function POST(request: Request) {
  const { symbol, quantity, price } = await request.json()
  const session = await getSession()
  
  const { data, error } = await supabase
    .from('holdings')
    .insert([{
      user_id: session.user.id,
      symbol,
      quantity,
      purchase_price: price,
      purchase_date: new Date(),
    }])
  
  return Response.json({ data, error })
}
```

## 8. Environment Variables Setup

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
ALPHA_VANTAGE_API_KEY=your_api_key
NEWS_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
```

## 9. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add other variables

# Redeploy with environment variables
vercel --prod
```

## 10. Next Steps

1. **Add TypeScript types** for API responses
2. **Implement error handling** and loading states
3. **Add caching** with SWR or React Query
4. **Set up API routes** for secure operations
5. **Implement form validation** on backend
6. **Add rate limiting** for API calls
7. **Set up CI/CD** with GitHub Actions
8. **Add E2E tests** with Cypress/Playwright
9. **Implement analytics** tracking
10. **Set up monitoring** with Sentry

## Summary

The current frontend is completely ready to accept real data. Simply:
1. Replace mock data imports with API calls
2. Add authentication middleware
3. Connect to real databases
4. Update environment variables
5. Deploy to production

All the UI/UX is already built and tested!
