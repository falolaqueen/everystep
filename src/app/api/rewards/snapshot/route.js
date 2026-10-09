import { NextResponse } from "next/server";
import { getRewardsSnapshot, currentRewardsCustomer } from "@/lib/es-rewards-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Do not expose a guest balance on a member-only profile endpoint.
    const ctx = await currentRewardsCustomer();
    if (!ctx.registered) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const { data: adminRow, error: adminError } = await ctx.admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", ctx.customer.auth_user_id)
      .maybeSingle();
    if (adminError) throw adminError;
    const snapshot = await getRewardsSnapshot();
    return NextResponse.json({ ...snapshot, unlimitedAi: Boolean(adminRow) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Rewards snapshot error:", error);
    return NextResponse.json({ error: "Unable to load rewards right now." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}