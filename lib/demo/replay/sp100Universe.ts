// ── S&P 100 Universe for Market Replay ──
// Static snapshot — no runtime API calls
// Source: S&P 100 constituents as of 2025-01-01

export interface SP100Company {
  symbol: string;
  name: string;
  sector: 'Technology' | 'Healthcare' | 'Financials' | 'Consumer' | 'Industrials' | 'Energy' | 'Communication' | 'Defensives';
  supportedForReplay: boolean;
}

// Exactly 100 S&P 100 companies with replay support flag
export const SP100_UNIVERSE: SP100Company[] = [
  // Technology (20)
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', supportedForReplay: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', supportedForReplay: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', supportedForReplay: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', supportedForReplay: true },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology', supportedForReplay: true },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', supportedForReplay: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Technology', supportedForReplay: true },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology', supportedForReplay: false },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', sector: 'Technology', supportedForReplay: false },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', supportedForReplay: false },
  { symbol: 'ORCL', name: 'Oracle Corp.', sector: 'Technology', supportedForReplay: false },
  { symbol: 'IBM', name: 'IBM Corp.', sector: 'Technology', supportedForReplay: false },
  { symbol: 'INTC', name: 'Intel Corp.', sector: 'Technology', supportedForReplay: false },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', supportedForReplay: false },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology', supportedForReplay: false },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication', supportedForReplay: false },
  { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Technology', supportedForReplay: false },
  { symbol: 'QCOM', name: 'Qualcomm Inc.', sector: 'Technology', supportedForReplay: false },
  { symbol: 'TXN', name: 'Texas Instruments', sector: 'Technology', supportedForReplay: false },
  { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology', supportedForReplay: false },

  // Healthcare (15)
  { symbol: 'LLY', name: 'Eli Lilly & Co.', sector: 'Healthcare', supportedForReplay: true },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', supportedForReplay: true },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'DHR', name: 'Danaher Corp.', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'GILD', name: 'Gilead Sciences', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'MDT', name: 'Medtronic plc', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'ISRG', name: 'Intuitive Surgical', sector: 'Healthcare', supportedForReplay: false },
  { symbol: 'VRTX', name: 'Vertex Pharmaceuticals', sector: 'Healthcare', supportedForReplay: false },

  // Financials (18)
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', supportedForReplay: true },
  { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financials', supportedForReplay: true },
  { symbol: 'WFC', name: 'Wells Fargo & Co.', sector: 'Financials', supportedForReplay: true },
  { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'Financials', supportedForReplay: false },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials', supportedForReplay: false },
  { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'Financials', supportedForReplay: false },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Financials', supportedForReplay: false },
  { symbol: 'AXP', name: 'American Express Co.', sector: 'Financials', supportedForReplay: false },
  { symbol: 'SCHW', name: 'Charles Schwab Corp.', sector: 'Financials', supportedForReplay: false },
  { symbol: 'CB', name: 'Chubb Ltd.', sector: 'Financials', supportedForReplay: false },
  { symbol: 'USB', name: 'U.S. Bancorp', sector: 'Financials', supportedForReplay: false },
  { symbol: 'PNC', name: 'PNC Financial Services', sector: 'Financials', supportedForReplay: false },
  { symbol: 'TFC', name: 'Truist Financial Corp.', sector: 'Financials', supportedForReplay: false },
  { symbol: 'MMC', name: 'Marsh & McLennan', sector: 'Financials', supportedForReplay: false },
  { symbol: 'SPGI', name: 'S&P Global Inc.', sector: 'Financials', supportedForReplay: false },
  { symbol: 'ICE', name: 'Intercontinental Exchange', sector: 'Financials', supportedForReplay: false },
  { symbol: 'AON', name: 'Aon plc', sector: 'Financials', supportedForReplay: false },
  { symbol: 'MCO', name: "Moody's Corp.", sector: 'Financials', supportedForReplay: false },

  // Consumer (12)
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'KO', name: 'Coca-Cola Co.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'PM', name: 'Philip Morris International', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'MDLZ', name: 'Mondelez International', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'CL', name: 'Colgate-Palmolive Co.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'GIS', name: 'General Mills Inc.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'KMB', name: 'Kimberly-Clark Corp.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'SYY', name: 'Sysco Corp.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'KDP', name: 'Keurig Dr Pepper Inc.', sector: 'Consumer', supportedForReplay: false },

  // Industrials (12)
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'HON', name: 'Honeywell International', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'GE', name: 'General Electric Co.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'RTX', name: 'RTX Corp.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'UNP', name: 'Union Pacific Corp.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'LMT', name: 'Lockheed Martin Corp.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'BA', name: 'Boeing Co.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'DE', name: 'Deere & Co.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'ETN', name: 'Eaton Corp.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'UPS', name: 'United Parcel Service', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'GD', name: 'General Dynamics Corp.', sector: 'Industrials', supportedForReplay: false },
  { symbol: 'WM', name: 'Waste Management Inc.', sector: 'Industrials', supportedForReplay: false },

  // Energy (6)
  { symbol: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy', supportedForReplay: false },
  { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy', supportedForReplay: false },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy', supportedForReplay: false },
  { symbol: 'SLB', name: 'Schlumberger Ltd.', sector: 'Energy', supportedForReplay: false },
  { symbol: 'EOG', name: 'EOG Resources Inc.', sector: 'Energy', supportedForReplay: false },
  { symbol: 'MPC', name: 'Marathon Petroleum Corp.', sector: 'Energy', supportedForReplay: false },

  // Communication (5)
  { symbol: 'VZ', name: 'Verizon Communications', sector: 'Communication', supportedForReplay: false },
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Communication', supportedForReplay: false },
  { symbol: 'CMCSA', name: 'Comcast Corp.', sector: 'Communication', supportedForReplay: false },
  { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication', supportedForReplay: false },
  { symbol: 'CHTR', name: 'Charter Communications', sector: 'Communication', supportedForReplay: false },

  // Defensives / ETFs / Other (12)
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'Defensives', supportedForReplay: true },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', supportedForReplay: true },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer', supportedForReplay: true },
  { symbol: 'KO', name: 'Coca-Cola Co.', sector: 'Consumer', supportedForReplay: true },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer', supportedForReplay: true },
  { symbol: 'MCD', name: "McDonald's Corp.", sector: 'Consumer', supportedForReplay: false },
  { symbol: 'NKE', name: 'Nike Inc.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer', supportedForReplay: false },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', supportedForReplay: true },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials', supportedForReplay: true },
  { symbol: 'COST', name: 'Costco Wholesale', sector: 'Consumer', supportedForReplay: true },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', supportedForReplay: true },
];

// Get only replay-supported companies
export function getReplaySupportedCompanies(): SP100Company[] {
  return SP100_UNIVERSE.filter(c => c.supportedForReplay);
}

// Get companies by sector
export function getCompaniesBySector(sector: SP100Company['sector']): SP100Company[] {
  return SP100_UNIVERSE.filter(c => c.sector === sector && c.supportedForReplay);
}

// Get company by symbol
export function getCompanyBySymbol(symbol: string): SP100Company | undefined {
  return SP100_UNIVERSE.find(c => c.symbol === symbol);
}
