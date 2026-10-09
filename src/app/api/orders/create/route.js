import { NextResponse } from "next/server";
import { currentRewardsCustomer } from "@/lib/es-rewards-server";
import { getEffectivePrice } from "@/lib/pricing";
import { sameOrigin } from "@/lib/es-payment-security";
import crypto from "node:crypto";

export const runtime = "nodejs";
const bad = (message, status = 400) => NextResponse.json({ error: message }, { status });
const money = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const safeString = (v, max) => String(v ?? "").trim().slice(0, max);

// Only trust images hosted in this store's public product-images bucket.
// This prevents customer-supplied links from pointing to unrelated websites.
const safeImage = value => {
  if (typeof value !== "string" || value.length > 2000) return null;
  try {
    const u = new URL(value);
    const root = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    return u.protocol === "https:" &&
      u.origin === root.origin &&
      u.pathname.startsWith("/storage/v1/object/public/product-images/")
      ? u.href : null;
  } catch { return null; }
};

const sizeArray = value => Array.isArray(value)
  ? value.map(String)
  : typeof value === "string" ? value.split(",").map(s => s.trim()) : [];

// Prefer the saved customized result, but accept older cart field names.
// Data URLs, blob URLs and third-party image URLs are intentionally rejected.
const orderImage = (item, product) => {
  const candidates = [
    item.customizedImageUrl,
    item.customized_image_url,
    item.customImageUrl,
    item.custom_image_url,
    item.finalImageUrl,
    item.final_image_url,
    item.previewImageUrl,
    item.preview_image_url,
    item.imageUrl,
    item.image,
    product.images?.[0],
  ];
  for (const candidate of candidates) {
    const url = safeImage(candidate);
    if (url) return url;
  }
  return null;
};

export async function POST(request) {
  if (!sameOrigin(request)) return bad("Invalid request origin", 403);
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 32000) return bad("Checkout request is too large", 413);
    const body = await request.json();
    const items = body?.items;
    if (!Array.isArray(items) || items.length < 1 || items.length > 20) return bad("Cart must contain 1–20 items");
    const contact = body?.customer || {};
    const name = safeString(contact.name, 100), phone = safeString(contact.phone, 40);
    const location = safeString(contact.location, 300), note = safeString(contact.note, 500);
    if (!name || !phone || !location) return bad("Name, phone and delivery location are required");

    const { admin, customer } = await currentRewardsCustomer();
    const ids = items.map(i => String(i.productId || ""));
    if (ids.some(i => !i || i.length > 100)) return bad("Invalid product selection");
    const { data: products, error: productError } = await admin.from("products")
      .select("*").in("id", [...new Set(ids)]).eq("is_active", true);
    if (productError) throw productError;
    const byId = new Map((products || []).map(p => [String(p.id), p]));
    const { data: settings, error: settingsError } = await admin.from("store_settings")
      .select("sale_enabled,sale_percent").eq("id", 1).maybeSingle();
    if (settingsError) throw settingsError;

    let total = 0;
    const lines = [];
    for (const item of items) {
      const p = byId.get(String(item.productId));
      if (!p) return bad("A product is no longer available. Please refresh your cart.");
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 20) return bad("Quantity must be between 1 and 20");
      const size = safeString(item.size, 30), color = safeString(item.color, 80);
      if (!size) return bad("Select a footwear size");
      const standard = sizeArray(p.sizes);
      const extra = sizeArray(p.extra_sizes);
      let sizeFee = 0;
      if (!standard.includes(size)) {
        if (!extra.includes(size)) return bad(`Size ${size} is not available for ${p.name}`);
        sizeFee = Number(p.extra_size_fee ?? 1000);
      }
      if (!Number.isFinite(sizeFee) || sizeFee < 0) throw new Error("Invalid size fee configuration");
      const base = getEffectivePrice(p, settings || {}).final;
      const unit = money(base + sizeFee);
      if (!Number.isFinite(unit) || unit < 0) throw new Error("Invalid product price");
      total = money(total + unit * qty);
      lines.push({
        product_id: String(p.id),
        product_name: safeString(p.name, 200),
        size,
        color,
        quantity: qty,
        unit_price: unit,
        original_unit_price: money(Number(p.price)),
        size_fee: sizeFee,
        image_url: orderImage(item, p),
      });
    }
    if (total > 9999999999) return bad("Order total is too large");
    const orderId = crypto.randomUUID();
    const orderNumber = `ES-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const { error: orderError } = await admin.from("es_orders").insert({
      id: orderId,
      order_number: orderNumber,
      customer_id: customer.id,
      amount_paid: total,
      status: "pending",
      payment_status: "awaiting_receipt",
      customer_name: name,
      customer_phone: phone,
      delivery_address: location,
      customer_note: note,
    });
    if (orderError) throw orderError;
    const { error: itemsError } = await admin.from("es_order_items")
      .insert(lines.map(line => ({ ...line, order_id: orderId })));
    if (itemsError) {
      await admin.from("es_orders").delete().eq("id", orderId).eq("status", "pending");
      throw itemsError;
    }
    return NextResponse.json({
      success: true, orderId, orderNumber, total,
      paymentStatus: "awaiting_receipt", nextStep: `/checkout/payment/${orderId}`,
    });
  } catch (error) {
    console.error("CHECKOUT CREATE ERROR", error);
    return bad("Unable to create your order. Please try again.", 500);
  }
}