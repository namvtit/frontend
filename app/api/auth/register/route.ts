import { authHandler, register } from "@/lib/auth/server";

export const runtime = "nodejs";
export const POST = authHandler(register);
