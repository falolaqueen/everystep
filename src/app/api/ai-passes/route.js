import { NextResponse } from "next/server";
import { getRewardsSnapshot } from "@/lib/es-rewards-server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await getRewardsSnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("AI pass status failed", error);
    return NextResponse.json({ error: "Unable to load AI passes" }, { status: 500 });
  }
}
