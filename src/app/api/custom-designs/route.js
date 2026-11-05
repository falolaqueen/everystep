
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { currentRewardsCustomer } from "@/lib/es-rewards-server";
import { sameOrigin } from "@/lib/es-payment-security";
import { ensureCustomDesignCategories } from "@/lib/custom-design-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (error, status = 400) =>
  NextResponse.json({ error }, { status });

const clean = (value, max) =>
  String(value ?? "").trim().slice(0, max);

const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const allowedSolePreferences = [
  "Foreign soles",
  "Nigerian soles",
  "No preference",
];

function validImage(bytes, mime) {
  if (mime === "image/jpeg") {
    return (
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255
    );
  }

  if (mime === "image/png") {
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }

  return (
    mime === "image/webp" &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

export async function GET() {
  try {
    const { admin } = await currentRewardsCustomer();

    // Synchronise custom-order categories with the admin categories.
    const categories = await ensureCustomDesignCategories(admin);

    return NextResponse.json(
      { categories },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("CUSTOM DESIGN CATEGORIES", error);
    return bad("Unable to load custom design options", 500);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return bad("Invalid request origin", 403);
  }

  if (
    Number(request.headers.get("content-length") || 0) >
    13_000_000
  ) {
    return bad(
      "Please upload no more than 3 photos, each under 4 MB",
      413
    );
  }

  const stored = [];
  let admin;

  try {
    const { admin: db, customer } =
      await currentRewardsCustomer();

    admin = db;

    const form = await request.formData();

    const name = clean(form.get("name"), 100);
    const whatsapp = clean(form.get("whatsapp"), 40);
    const category = clean(form.get("category"), 80);
    const solePreference = clean(
      form.get("solePreference") || "No preference",
      40
    );
    const styleRange = clean(form.get("styleRange"), 100);
    const size = clean(form.get("size"), 30);
    const specifications = clean(
      form.get("specifications"),
      1800
    );
    const quantity = Number(form.get("quantity") || 1);

    if (
      !name ||
      !whatsapp ||
      !category ||
      !size ||
      specifications.length < 10
    ) {
      return bad(
        "Please complete your name, WhatsApp number, footwear type, size and design details."
      );
    }

    if (!/^\+?[0-9 ()-]{8,24}$/.test(whatsapp)) {
      return bad(
        "Enter a valid WhatsApp number with country code if possible."
      );
    }

    if (
      !allowedSolePreferences.includes(solePreference)
    ) {
      return bad("Choose a valid sole preference.");
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    ) {
      return bad(
        "Quantity must be between 1 and 10 pairs."
      );
    }

    // Refresh the custom categories before validating the selection.
    await ensureCustomDesignCategories(admin);

    const { data: categoryRow, error: categoryError } =
      await admin
        .from("es_custom_categories")
        .select("name")
        .eq("name", category)
        .eq("is_active", true)
        .maybeSingle();

    if (categoryError) throw categoryError;

    if (!categoryRow) {
      return bad(
        "Choose one of the available footwear types."
      );
    }

    const files = form
      .getAll("photos")
      .filter(
        (file) =>
          file &&
          typeof file.arrayBuffer === "function" &&
          file.size > 0
      );

    if (files.length > 3) {
      return bad("Upload a maximum of 3 reference photos.");
    }

    for (const file of files) {
      if (
        !imageTypes[file.type] ||
        file.size > 4_000_000 ||
        file.size < 100
      ) {
        return bad(
          "Each photo must be a JPG, PNG or WebP under 4 MB."
        );
      }

      const bytes = Buffer.from(await file.arrayBuffer());

      if (!validImage(bytes, file.type)) {
        return bad(
          "A photo's file type does not match its contents."
        );
      }

      const path = `${customer.id}/${crypto.randomUUID()}.${
        imageTypes[file.type]
      }`;

      const { error } = await admin.storage
        .from("es-custom-designs")
        .upload(path, bytes, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      stored.push(path);
    }

    const { data: order, error } = await admin
      .from("es_custom_design_orders")
      .insert({
        customer_id: customer.id,
        customer_name: name,
        whatsapp_number: whatsapp,
        category,
        sole_preference: solePreference,
        style_range: styleRange,
        size,
        quantity,
        specifications,
        photo_paths: stored,
        status: "submitted",
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      orderId: order.id,
    });
  } catch (error) {
    if (stored.length && admin) {
      await admin.storage
        .from("es-custom-designs")
        .remove(stored);
    }

    console.error("CUSTOM DESIGN SUBMISSION", error);

    return bad(
      "Unable to submit your design. Please try again.",
      500
    );
  }
}