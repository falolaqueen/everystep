
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!base || !key) {
      return NextResponse.json(
        {
          error:
            "Supabase URL or public key is missing in the server environment.",
        },
        { status: 500 }
      );
    }

    const url = new URL("/rest/v1/products", base);

    url.searchParams.set(
      "select",
      "id,name,slug,price,images"
    );
    url.searchParams.set("is_active", "eq.true");
    url.searchParams.set("order", "name.asc");
    url.searchParams.set("limit", "100");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!response.ok || !Array.isArray(data)) {
      console.error(
        "PRODUCT CATALOGUE ERROR:",
        response.status,
        raw.slice(0, 400)
      );

      return NextResponse.json(
        {
          error:
            "Could not load products. Check Supabase public read access and environment variables.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error("PRODUCT CATALOGUE ERROR:", error);

    return NextResponse.json(
      { error: "Could not load products." },
      { status: 500 }
    );
  }
}
