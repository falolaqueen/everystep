import { NextResponse } from "next/server";
import { customerOrder } from "@/lib/es-payment-security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!/^[0-9a-f-]{36}$/i.test(id || "")) return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    const { order } = await customerOrder(id);
    if (!order) return NextResponse.json({ error: "Order not found in this session" }, { status: 404 });
    return NextResponse.json({ order: { id: order.id, orderNumber: order.order_number, amount: order.amount_paid, paymentStatus: order.payment_status, productionStatus: order.production_status }, bank: {
      bankName: process.env.ES_BANK_NAME || "", accountName: process.env.ES_BANK_ACCOUNT_NAME || "", accountNumber: process.env.ES_BANK_ACCOUNT_NUMBER || ""
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { console.error("PAYMENT DETAILS", error); return NextResponse.json({ error: "Could not load order" }, { status: 500 }); }
}
