import { NextResponse } from "next/server";
import { DEBUG_MODE, getDebugState, resetDebugState } from "@/lib/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!DEBUG_MODE) {
    return NextResponse.json({ error: "Debug mode disabled" }, { status: 404 });
  }
  resetDebugState();
  return NextResponse.json({ ok: true, debugState: getDebugState() });
}
