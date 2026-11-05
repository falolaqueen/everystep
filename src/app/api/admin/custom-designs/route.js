import { NextResponse } from "next/server";
import OpenAI from "openai";
import { authorizedAdmin, sameOrigin } from "@/lib/es-payment-security";
import { ensureCustomDesignCategories } from "@/lib/custom-design-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (error, status = 400) =>
  NextResponse.json({ error }, { status });

const clean = (v, max = 500) =>
  String(v ?? "").trim().slice(0, max);

const money = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const solePreferences = ["Nigerian soles", "Foreign soles", "No preference"];

export async function GET() {
  try {
    const access = await authorizedAdmin();
    if (!access) return bad("Unauthorized", 403);

    const { admin } = access;

    const [ordersRes, categories, materialsRes] = await Promise.all([
      admin
        .from("es_custom_design_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
      ensureCustomDesignCategories(admin, { includeInactive: true }),
      admin.from("es_custom_materials").select("*").order("name"),
    ]);

    const error = ordersRes.error || materialsRes.error;
    if (error) throw error;

    const orders = await Promise.all(
      (ordersRes.data || []).map(async (order) => {
        const photos = await Promise.all(
          (order.photo_paths || []).map(async (path) => {
            const { data, error: signedError } = await admin.storage
              .from("es-custom-designs")
              .createSignedUrl(path, 3600);

            return signedError ? null : data?.signedUrl || null;
          })
        );

        return {
          ...order,
          photos: photos.filter(Boolean),
        };
      })
    );

    return NextResponse.json(
      { orders, categories, materials: materialsRes.data || [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("ADMIN CUSTOM DESIGNS GET", error);
    return bad("Unable to load custom design orders", 500);
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return bad("Invalid request origin", 403);
  }

  try {
    const access = await authorizedAdmin();
    if (!access) return bad("Unauthorized", 403);

    const { admin } = access;
    const body = await request.json();

    if (body.action === "save-category") {
      const name = clean(body.name, 80);
      const nigeriaPrice = Number(body.nigeriaSolePrice);
      const foreignPrice = Number(body.foreignSolePrice);
      const sort = Number(body.sortOrder || 0);

      if (
        !name ||
        !Number.isFinite(nigeriaPrice) ||
        nigeriaPrice < 0 ||
        !Number.isFinite(foreignPrice) ||
        foreignPrice < 0
      ) {
        return bad("Enter a category name and valid non-negative sole prices.");
      }

      const payload = {
        name,
        nigeria_sole_price: money(nigeriaPrice),
        foreign_sole_price: money(foreignPrice),
        is_active: body.isActive !== false,
        sort_order: Number.isInteger(sort) ? sort : 0,
        updated_at: new Date().toISOString(),
      };

      const query = body.id
        ? admin.from("es_custom_categories").update(payload).eq("id", body.id)
        : admin.from("es_custom_categories").insert(payload);

      const { error } = await query;
      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (body.action === "save-material") {
      const name = clean(body.name, 100);
      const cost = Number(body.unitCost);

      if (!name || !Number.isFinite(cost) || cost < 0) {
        return bad("Enter a material name and valid cost.");
      }

      const alternatives = Array.isArray(body.alternativeIds)
        ? body.alternativeIds
            .filter((x) => typeof x === "string")
            .slice(0, 30)
        : [];

      const payload = {
        name,
        unit_cost: money(cost),
        is_available: body.isAvailable !== false,
        alternative_ids: alternatives,
        notes: clean(body.notes, 500),
        updated_at: new Date().toISOString(),
      };

      const query = body.id
        ? admin.from("es_custom_materials").update(payload).eq("id", body.id)
        : admin.from("es_custom_materials").insert(payload);

      const { error } = await query;
      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (body.action === "classify") {
      if (!process.env.OPENAI_API_KEY) {
        return bad(
          "AI classification is unavailable: OPENAI_API_KEY is not configured.",
          503
        );
      }

      const { data: order, error: orderError } = await admin
        .from("es_custom_design_orders")
        .select("id,photo_paths")
        .eq("id", body.orderId)
        .single();

      if (orderError) throw orderError;
      if (!order.photo_paths?.length) {
        return bad("This customer did not upload a reference photo.");
      }

      const categories = await ensureCustomDesignCategories(admin);

      const { data: file, error: fileError } = await admin.storage
        .from("es-custom-designs")
        .download(order.photo_paths[0]);

      if (fileError) throw fileError;

      const mime = file.type || "image/jpeg";

      if (!/^image\/(jpeg|png|webp)$/.test(mime)) {
        return bad("Unsupported reference image type.");
      }

      const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 45000,
        maxRetries: 1,
      });

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Identify the closest footwear category from this exact list: ${(categories || [])
                  .map((x) => x.name)
                  .join(", ")}. Return JSON only: {"category":"one exact category name","confidence":0.0,"reason":"brief visual reason"}. If uncertain choose "Other / not sure" only if that exact category exists; otherwise choose the closest match. Do not estimate price.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mime};base64,${base64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
      });

      const result = JSON.parse(
        response.choices?.[0]?.message?.content || "{}"
      );

      const allowed = (categories || []).some(
        (x) => x.name === result.category
      );

      if (!allowed) {
        return bad(
          "AI could not confidently match one of the configured categories.",
          422
        );
      }

      const confidence = Math.max(
        0,
        Math.min(1, Number(result.confidence) || 0)
      );

      const { error } = await admin
        .from("es_custom_design_orders")
        .update({
          ai_suggested_category: result.category,
          ai_confidence: confidence,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.orderId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        category: result.category,
        confidence,
        reason: clean(result.reason, 300),
      });
    }

    if (body.action === "update-order") {
      const id = clean(body.orderId, 60);

      const { data: order, error: orderError } = await admin
        .from("es_custom_design_orders")
        .select(
          "id,quantity,category,sole_preference,quote_amount,quote_breakdown"
        )
        .eq("id", id)
        .single();

      if (orderError) throw orderError;

      const statuses = [
        "submitted",
        "reviewing",
        "needs_materials",
        "quoted",
        "accepted",
        "in_production",
        "completed",
        "declined",
      ];

      const status = statuses.includes(body.status)
        ? body.status
        : "reviewing";

      const ids = Array.isArray(body.materialIds)
        ? [...new Set(body.materialIds.filter((x) => typeof x === "string"))].slice(
            0,
            50
          )
        : [];

      const categoryName = clean(body.category || order.category, 80);
      const solePreference = solePreferences.includes(body.solePreference)
        ? body.solePreference
        : order.sole_preference || "No preference";

      let quote = null;
      let breakdown = {};

      if (body.makeQuote) {
        if (
          solePreference !== "Nigerian soles" &&
          solePreference !== "Foreign soles"
        ) {
          return bad(
            "Choose Nigerian soles or Foreign soles for this order before creating a quotation.",
            409
          );
        }

        const [
          { data: category, error: categoryError },
          { data: materials, error: materialsError },
        ] = await Promise.all([
          admin
            .from("es_custom_categories")
            .select(
              "name,nigeria_sole_price,foreign_sole_price,is_active"
            )
            .eq("name", categoryName)
            .eq("is_active", true)
            .single(),
          ids.length
            ? admin
                .from("es_custom_materials")
                .select("id,name,unit_cost,is_available")
                .in("id", ids)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (categoryError || materialsError) {
          throw categoryError || materialsError;
        }

        if (!category) {
          return bad("The selected footwear category is no longer active.", 409);
        }

        const unavailable = (materials || []).filter(
          (material) => !material.is_available
        );

        if (unavailable.length) {
          return bad(
            `Unavailable materials selected: ${unavailable
              .map((material) => material.name)
              .join(", ")}. Choose an available alternative before quoting.`,
            409
          );
        }

        const solePrice =
          solePreference === "Foreign soles"
            ? Number(category.foreign_sole_price || 0)
            : Number(category.nigeria_sole_price || 0);

        const materialTotal = money(
          (materials || []).reduce(
            (sum, material) => sum + Number(material.unit_cost || 0),
            0
          )
        );

        const pairSubtotal = money(solePrice + materialTotal);

        if (pairSubtotal <= 0) {
          return bad(
            `Set a ${solePreference} price or material cost for this category before creating a quotation.`,
            409
          );
        }

        quote = money(pairSubtotal * Number(order.quantity || 1));

        breakdown = {
          category: category.name,
          solePreference,
          solePrice,
          materials: (materials || []).map((material) => ({
            id: material.id,
            name: material.name,
            cost: Number(material.unit_cost || 0),
          })),
          materialTotal,
          quantity: Number(order.quantity || 1),
          perPair: pairSubtotal,
          total: quote,
        };
      } else if (
        body.quoteAmount !== undefined &&
        body.quoteAmount !== ""
      ) {
        quote = Number(body.quoteAmount);

        if (
          !Number.isFinite(quote) ||
          quote <= 0 ||
          quote > 999999999
        ) {
          return bad("Enter a quotation greater than ₦0.");
        }

        quote = money(quote);
        breakdown = {
          manuallySet: true,
          solePreference,
          total: quote,
        };
      }

      const { data: selectedMaterials, error: selectedError } = ids.length
        ? await admin
            .from("es_custom_materials")
            .select("id,is_available")
            .in("id", ids)
        : { data: [], error: null };

      if (selectedError) throw selectedError;

      const hasUnavailable = (selectedMaterials || []).some(
        (material) => !material.is_available
      );

      if (hasUnavailable && body.makeQuote) {
        return bad(
          "One or more selected materials are unavailable. Choose an available alternative before quoting.",
          409
        );
      }

      if (!body.makeQuote && body.quoteAmount === undefined) {
        quote = order.quote_amount;
        breakdown = order.quote_breakdown || {};
      }

      const payload = {
        category: categoryName,
        sole_preference: solePreference,
        selected_material_ids: ids,
        status: hasUnavailable
          ? "needs_materials"
          : status === "quoted" && quote === null
            ? "reviewing"
            : status,
        quote_amount: quote,
        quote_breakdown: breakdown,
        admin_note: clean(body.adminNote, 1500),
        updated_at: new Date().toISOString(),
      };

      const { error } = await admin
        .from("es_custom_design_orders")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        quoteAmount: quote,
        quoteBreakdown: breakdown,
      });
    }

    return bad("Unknown action.");
  } catch (error) {
    console.error("ADMIN CUSTOM DESIGNS POST", error);
    return bad(
      "Unable to save custom design changes. Please try again.",
      500
    );
  }
}