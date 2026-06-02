'use client';

import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Send, Loader, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        'Hello! I&apos;m your AI market analyst. I can help you analyze stocks, provide market insights, and answer questions about your portfolio. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const responses = [
        'Based on current market trends, I&apos;d recommend monitoring this sector. The technical indicators suggest potential upside, but keep an eye on resistance levels.',
        'This is a strong buy signal according to fundamental analysis. The company has shown consistent growth and positive earnings surprises.',
        'The portfolio rebalancing you mentioned could work well. Consider a 60/40 stocks/bonds allocation based on your risk profile.',
        'That&apos;s an interesting question. The correlation between tech and commodities has been increasing lately, which could affect diversification.',
        'Looking at historical data, similar patterns have preceded major market movements. I&apos;d suggest reviewing your stop-loss orders.',
      ];

      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">AI Market Analyst</h1>
          </div>
          <p className="text-muted-foreground">
            Get intelligent market insights and personalized investment recommendations
          </p>
        </div>
      </section>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
            {messages.length === 1 && (
              <div className="grid gap-4 sm:grid-cols-2 mb-8">
                <div className="p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors cursor-pointer hover:shadow-lg">
                  <MessageSquare className="h-6 w-6 text-primary mb-2" />
                  <p className="font-semibold text-foreground">
                    Analyze My Portfolio
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get AI-powered insights on your holdings
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors cursor-pointer hover:shadow-lg">
                  <Sparkles className="h-6 w-6 text-primary mb-2" />
                  <p className="font-semibold text-foreground">Market Trends</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Discover emerging opportunities and risks
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-lg px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  <p className="leading-relaxed">{message.content}</p>
                  <p
                    className={`mt-2 text-xs ${
                      message.type === 'user'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {message.type === 'user' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                    <span className="text-sm font-bold text-foreground">U</span>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-2xl rounded-lg bg-card border border-border px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <Loader className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Analyzing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <section className="border-t border-border bg-card/50 p-4 sm:p-6">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about stocks, portfolios, or market trends..."
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This is a demo. For actual investment advice, please consult a financial advisor.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
