import "server-only";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth/server";
import { getDatabase, transaction } from "@/lib/db";
import { executionPrice } from "./quote";

class TradeError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function tradingHandler(handler: (request: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      return await handler(request, user.id);
    } catch (error) {
      if (error instanceof AuthError || error instanceof TradeError) {
        return json({ error: error.message }, error.status);
      }
      console.error("Paper trading request failed.");
      return json({ error: "Paper trading service unavailable." }, 503);
    }
  };
}

export async function portfolio(_request: NextRequest, userId: string) {
  // One statement gives cash and positions from the same database snapshot.
  const { rows } = await getDatabase().query(
    `SELECT p.user_id, p.cash::text, 'USD' AS currency, p.created_at,
       COALESCE((SELECT json_agg(json_build_object(
         'symbol', symbol, 'quantity', quantity::text, 'average_cost', average_cost::text
       ) ORDER BY symbol) FROM positions WHERE portfolio_id = p.user_id), '[]') AS positions
     FROM portfolios p WHERE p.user_id = $1`, [userId],
  );
  return json({ portfolio: rows[0] });
}

export async function tradeHistory(_request: NextRequest, userId: string) {
  const { rows } = await getDatabase().query(
    `SELECT id, symbol, side, quantity, price, total, executed_at FROM trades
     WHERE portfolio_id = $1 ORDER BY executed_at DESC, id DESC`, [userId],
  );
  return json({ trades: rows });
}

export async function executeTrade(request: NextRequest, userId: string) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new TradeError("Invalid JSON body.", 400);
  }
  if (!body || typeof body.symbol !== "string" || !["BUY", "SELL"].includes(body.side) ||
      typeof body.quantity !== "number" || !Number.isFinite(body.quantity) ||
      body.quantity <= 0 || body.quantity > 1_000_000_000 ||
      !/^\d+(\.\d{1,6})?$/.test(String(body.quantity))) {
    throw new TradeError("Provide a symbol, BUY or SELL, and a positive quantity (up to 6 decimal places, maximum 1000000000).", 400);
  }
  // Yahoo uses a dash for share classes; normalize aliases to one position.
  const symbol = body.symbol.trim().toUpperCase().replaceAll(".", "-");
  if (!/^[A-Z][A-Z0-9-]{0,14}$/.test(symbol)) throw new TradeError("Invalid symbol.", 400);
  const side: "BUY" | "SELL" = body.side;
  const quantity = String(body.quantity);
  let price: string;
  try {
    price = await executionPrice(symbol);
  } catch {
    throw new TradeError("A verified USD stock quote is unavailable. Try again later.", 503);
  }

  const trade = await transaction(async (client) => {
    // Every trade locks the same row first, serializing all changes for this user.
    await client.query("SELECT user_id FROM portfolios WHERE user_id = $1 FOR UPDATE", [userId]);
    if (side === "BUY") {
      const cash = await client.query(
        `UPDATE portfolios SET cash = cash - $2::numeric * $3::numeric
         WHERE user_id = $1 AND cash >= $2::numeric * $3::numeric RETURNING cash`,
        [userId, quantity, price],
      );
      if (!cash.rowCount) throw new TradeError("Insufficient cash.", 409);
      await client.query(
        `INSERT INTO positions (portfolio_id, symbol, quantity, average_cost) VALUES ($1, $2, $3, $4)
         ON CONFLICT (portfolio_id, symbol) DO UPDATE SET
           average_cost = (positions.quantity * positions.average_cost + EXCLUDED.quantity * EXCLUDED.average_cost)
                          / (positions.quantity + EXCLUDED.quantity),
           quantity = positions.quantity + EXCLUDED.quantity`,
        [userId, symbol, quantity, price],
      );
    } else {
      const held = await client.query(
        "SELECT quantity >= $3::numeric AS sufficient FROM positions WHERE portfolio_id = $1 AND symbol = $2",
        [userId, symbol, quantity],
      );
      if (!held.rows[0]?.sufficient) throw new TradeError("Insufficient quantity.", 409);
      await client.query(
        "DELETE FROM positions WHERE portfolio_id = $1 AND symbol = $2 AND quantity = $3::numeric",
        [userId, symbol, quantity],
      );
      await client.query(
        "UPDATE positions SET quantity = quantity - $3::numeric WHERE portfolio_id = $1 AND symbol = $2",
        [userId, symbol, quantity],
      );
      await client.query(
        "UPDATE portfolios SET cash = cash + $2::numeric * $3::numeric WHERE user_id = $1",
        [userId, quantity, price],
      );
    }
    const { rows } = await client.query(
      `INSERT INTO trades (id, portfolio_id, symbol, side, quantity, price, total)
       VALUES ($1, $2, $3, $4, $5, $6, $5::numeric * $6::numeric)
       RETURNING id, symbol, side, quantity, price, total, executed_at`,
      [randomUUID(), userId, symbol, side, quantity, price],
    );
    return rows[0];
  });
  return json({ trade }, 201);
}
