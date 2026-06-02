// AI Agent types
export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: AICard[];
  timestamp: string;
}

export interface AICard {
  type: "summary" | "risk" | "sentiment" | "technical" | "compare" | "watchlist" | "news";
  title: string;
  content: string;
  data?: Record<string, string | number>;
  sentiment?: "bullish" | "bearish" | "neutral";
}

export interface AIAgentRequest {
  message: string;
  symbol?: string;
  context?: {
    watchlist?: string[];
    recentSymbols?: string[];
  };
}

export interface AIAgentResponse {
  message: string;
  cards: AICard[];
}
