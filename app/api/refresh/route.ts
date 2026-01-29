import { NextResponse } from "next/server";
import { getStatus } from "@/lib/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const data = await getStatus(true);
  return NextResponse.json({ ok: true, refreshedAt: data.fetchedAt });
}
