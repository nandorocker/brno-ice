import { NextResponse } from "next/server";
import { DEBUG_MODE, getDebugState, setDebugState } from "@/lib/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!DEBUG_MODE) {
    return NextResponse.json({ error: "Debug mode disabled" }, { status: 404 });
  }
  return NextResponse.json(getDebugState());
}

export async function POST(req: Request) {
  if (!DEBUG_MODE) {
    return NextResponse.json({ error: "Debug mode disabled" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  setDebugState(body);
  return NextResponse.json({ ok: true, debugState: getDebugState() });
}
