import { authHandler, logout } from "@/lib/auth/server";

export const runtime = "nodejs";
export const POST = authHandler(logout);
