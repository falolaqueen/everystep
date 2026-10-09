import { NextResponse } from "next/server";
import { authorizedAdmin, sameOrigin } from "@/lib/es-payment-security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request) {
 try {
  const access = await authorizedAdmin();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { admin } = access;
  const { data: orders, error } = await admin.from("es_orders").select("id,order_number,amount_paid,customer_name,customer_phone,delivery_address,payment_status,production_status,created_at").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  const ids = orders.map(o => o.id);
  const { data: submissions, error: e2 } = ids.length ? await admin.from("es_payment_submissions").select("id,order_id,receipt_path,transfer_reference,payment_status,created_at,admin_note,notification_status").in("order_id", ids).order("created_at", { ascending: false }) : { data: [], error: null };
  if (e2) throw e2;
  return NextResponse.json({ orders, submissions }, { headers: { "Cache-Control": "no-store" } });
 } catch (e) { console.error("ADMIN ORDERS",e); return NextResponse.json({ error: "Could not load orders" }, { status: 500 }); }
}
export async function POST(request) {
 if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
 try {
  const access = await authorizedAdmin();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const body = await request.json();
  if (body.action === "receipt-link") {
   const { data: receipt, error } = await access.admin.from("es_payment_submissions").select("receipt_path").eq("id",body.submissionId).single();
   if (error) throw error;
   const { data, error: signedError } = await access.admin.storage.from("payment-receipts").createSignedUrl(receipt.receipt_path, 60);
   if (signedError) throw signedError;
   return NextResponse.json({ url: data.signedUrl });
  }
  if (body.action === "review") {
   if (!["confirmed","rejected"].includes(body.decision)) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
   const { error } = await access.admin.rpc("es_review_payment", { p_submission_id: body.submissionId, p_admin_id: access.user.id, p_decision: body.decision, p_note: String(body.note || "").slice(0,1000) });
   if (error) return NextResponse.json({ error: error.message }, { status: 409 });
   return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
 } catch (e) { console.error("ADMIN PAYMENT ACTION",e); return NextResponse.json({ error: "Could not complete action" }, { status: 500 }); }
}
