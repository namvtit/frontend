CREATE TABLE portfolios (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cash NUMERIC NOT NULL DEFAULT 100000 CHECK (cash >= 0 AND cash < 'Infinity'::numeric),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE positions (
  portfolio_id UUID NOT NULL REFERENCES portfolios(user_id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0 AND quantity < 'Infinity'::numeric),
  average_cost NUMERIC NOT NULL CHECK (average_cost > 0 AND average_cost < 'Infinity'::numeric),
  PRIMARY KEY (portfolio_id, symbol)
);

CREATE TABLE trades (
  id UUID PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(user_id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0 AND quantity < 'Infinity'::numeric),
  price NUMERIC NOT NULL CHECK (price > 0 AND price < 'Infinity'::numeric),
  total NUMERIC NOT NULL CHECK (total > 0 AND total < 'Infinity'::numeric),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX trades_portfolio_history_idx ON trades (portfolio_id, executed_at DESC, id DESC);

-- Existing accounts receive the same starting balance as new registrations.
INSERT INTO portfolios (user_id) SELECT id FROM users;
