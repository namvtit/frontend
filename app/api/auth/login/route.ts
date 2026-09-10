import { authHandler, login } from "@/lib/auth/server";

export const runtime = "nodejs";
export const POST = authHandler(login);
