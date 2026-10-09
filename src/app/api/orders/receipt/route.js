import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { customerOrder, sameOrigin } from "@/lib/es-payment-security";
export const runtime = "nodejs";
const reply = (error, status) => NextResponse.json({ error }, { status });
const formats = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
function validMagic(buf, mime) {
  if (mime === "image/jpeg") return buf[0] === 255 && buf[1] === 216 && buf[2] === 255;
  if (mime === "image/png") return buf.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === "image/webp") return buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP";
  if (mime === "application/pdf") return buf.toString("ascii", 0, 5) === "%PDF-";
  return false;
}
export async function POST(request) {
  if (!sameOrigin(request)) return reply("Invalid request origin", 403);
  if (Number(request.headers.get("content-length") || 0) > 4_300_000) return reply("File too large (max 4 MB)", 413);
  let storedPath;
  let admin;
  try {
    const form = await request.formData();
    const id = String(form.get("orderId") || "");
    const file = form.get("receipt");
    const reference = String(form.get("reference") || "").trim().slice(0, 100);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply("Invalid order", 400);
    if (!(file instanceof File) || !formats[file.type] || file.size < 100 || file.size > 4_000_000) return reply("Upload a JPG, PNG, WebP or PDF smaller than 4 MB", 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!validMagic(bytes, file.type)) return reply("File format does not match its content", 400);
    const access = await customerOrder(id);
    admin = access.admin;
    const order = access.order;
    if (!order) return reply("Order not found", 404);
    if (!["awaiting_receipt", "rejected"].includes(order.payment_status)) return reply("This order cannot accept a new receipt", 409);
    const { data: pending, error: pendingError } = await admin.from("es_payment_submissions").select("id").eq("order_id", id).eq("payment_status", "under_review").limit(1);
    if (pendingError) throw pendingError;
    if (pending?.length) return reply("A receipt is already awaiting review", 409);
    storedPath = `${id}/${crypto.randomUUID()}.${formats[file.type]}`;
    const { error: uploadError } = await admin.storage.from("payment-receipts").upload(storedPath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: submission, error: submitError } = await admin.rpc("es_submit_payment_receipt", { p_order_id: id, p_customer_id: access.customer.id, p_receipt_path: storedPath, p_reference: reference || null });
    if (submitError) { await admin.storage.from("payment-receipts").remove([storedPath]); return reply(submitError.message || "Unable to submit receipt", 409); }
    // Customer initiates the WhatsApp message from the payment page.
    // No Cloud API call or automatic notification is attempted.
    return NextResponse.json({ success: true, orderNumber: order.order_number, paymentStatus: "under_review" });
  } catch (err) { console.error("RECEIPT UPLOAD", err); return reply("Could not submit receipt", 500); }
}
