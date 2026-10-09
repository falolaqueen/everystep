import { NextResponse } from "next/server";
import { getRewardsSnapshot } from "@/lib/es-rewards-server";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await getRewardsSnapshot(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { console.error(error); return NextResponse.json({ error: "Rewards unavailable" }, { status: 500 }); }
}
