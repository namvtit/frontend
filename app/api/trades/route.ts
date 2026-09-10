import { executeTrade, tradeHistory, tradingHandler } from "@/lib/trading/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = tradingHandler(tradeHistory);
export const POST = tradingHandler(executeTrade);
