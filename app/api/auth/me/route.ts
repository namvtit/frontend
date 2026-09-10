import { authHandler, me } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = authHandler(me);
