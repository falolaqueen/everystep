import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import Navbar from "@/component/Navbar";
import ProductCustomizer from "@/component/ProductCustomizer";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}) {
  const { slug } = await params;

  const supabase =
    await createClient();

  // ==============================
  // LOAD PRODUCT
  // ==============================

  const {
    data: product,
    error: productError,
  } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (
    productError ||
    !product
  ) {
    notFound();
  }

  // ==============================
  // LOAD CUSTOMIZABLE PARTS
  // ==============================

  const {
    data: productParts,
    error: partsError,
  } = await supabase
    .from("product_parts")
    .select("*")
    .eq(
      "product_id",
      product.id
    )
    .order("created_at", {
      ascending: true,
    });

  if (partsError) {
    console.error(
      "Product parts loading error:",
      partsError
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF9F4]">

      <Navbar />

      <div className="mx-auto max-w-7xl px-5 py-10">

        <ProductCustomizer
          product={product}
          productParts={
            productParts || []
          }
        />

      </div>

    </main>
  );
}