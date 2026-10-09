import ProductReviews from "@/component/ProductReviews";
import SizeGuide from "@/component/SizeGuide";

import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import Navbar from "@/component/Navbar";
import ProductCustomizer from "@/component/ProductCustomizer";
import VirtualTryOn from "@/component/VirtualTryOn";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { slug } = await params;

  const supabase = await createClient();

  // LOAD PRODUCT
  const {
    data: product,
    error: productError,
  } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (productError || !product) {
    notFound();
  }

  // LOAD CUSTOMIZABLE PARTS
  const {
    data: productParts,
    error: partsError,
  } = await supabase
    .from("product_parts")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", {
      ascending: true,
    });

  if (partsError) {
    console.error(
      "Product parts loading error:",
      partsError
    );
  }

  // LOAD ACTIVE STORE DISCOUNT
  const {
    data: saleSettings,
    error: saleError,
  } = await supabase
    .from("store_settings")
    .select("sale_enabled,sale_percent")
    .eq("id", 1)
    .maybeSingle();

  if (saleError) {
    console.error(
      "Sale settings loading error:",
      saleError
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF9F4]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* PRODUCT CUSTOMIZATION */}
        <ProductCustomizer
          product={product}
          productParts={productParts || []}
          saleSettings={
            saleSettings || {
              sale_enabled: false,
              sale_percent: 0,
            }
          }
        />

        {/* AI VIRTUAL TRY-ON */}
        <VirtualTryOn product={product} />
        {/* <SizeGuide availableSizes={product.sizes} /> */}
        {/* <ProductReviews productId={product.id} /> */}
      </div>
    </main>
  );
}
