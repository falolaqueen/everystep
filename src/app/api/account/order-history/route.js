import { NextResponse } from "next/server";
import { currentRewardsCustomer } from "@/lib/es-rewards-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const { admin, customer, registered } = await currentRewardsCustomer();
    if (!registered) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    const [{ data: orders, error: e1 }, { data: balance, error: e2 }, { data: ledger, error: e3 }] = await Promise.all([
      admin.from("es_orders").select("id,order_number,amount_paid,payment_status,production_status,status,estimated_delivery_date,created_at").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(100),
      admin.from("es_ai_balances").select("available").eq("customer_id", customer.id).maybeSingle(),
      admin.from("es_coin_ledger").select("coins").eq("customer_id", customer.id)
    ]);
    if (e1 || e2 || e3) throw e1 || e2 || e3;
    const { data: adminRow, error: adminError } = await admin.from("admin_users")
      .select("user_id").eq("user_id", customer.auth_user_id).maybeSingle();
    if (adminError) throw adminError;
    const isAdmin = Boolean(adminRow);
    const ids = (orders || []).map(o => o.id);
    let updates = [];
    if (ids.length) {
      const { data, error } = await admin.from("es_order_updates").select("order_id,status,note,created_at").in("order_id", ids).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      updates = data || [];
    }
    const latest = new Map();
    for (const u of updates) if (!latest.has(u.order_id)) latest.set(u.order_id, { status: u.status, note: u.note, createdAt: u.created_at });
    return NextResponse.json({
      orders: (orders || []).map(o => ({ id:o.id, orderNumber:o.order_number, amount:o.amount_paid, paymentStatus:o.payment_status, productionStatus:o.production_status, delivered:o.production_status === "delivered" || o.status === "fulfilled", estimatedDate:o.estimated_delivery_date, latestUpdate:latest.get(o.id) || null })),
      coins: (ledger || []).reduce((sum, x) => sum + Number(x.coins || 0), 0), aiPasses: isAdmin ? "Unlimited" : (balance?.available ?? 0), isAdmin
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { console.error("Order history", error); return NextResponse.json({ error:"Unable to load order history" }, { status:500 }); }
}