import { NextResponse } from "next/server";
import { getStatus, SOURCE_URL, DEBUG_MODE, getDebugState } from "@/lib/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStatus(false);
  return NextResponse.json({
    source: SOURCE_URL,
    cachedAt: data.fetchedAt,
    measurementDate: data.measurementDate,
    thicknessRange: data.thicknessRange,
    warnings: data.warnings,
    status: data.status,
    reason: data.reason,
    detailsCzLines: data.detailsCzLines,
    detailsEnLines: data.detailsEnLines,
    debug: DEBUG_MODE ? { enabled: getDebugState().enabled, seasonOverride: getDebugState().overrides.seasonOverride } : undefined,
  });
}
