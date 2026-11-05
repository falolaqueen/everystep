
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import Navbar from "@/component/Navbar";
import ProductCustomizer from "@/component/ProductCustomizer";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { slug } = await params;

  const supabase = await createClient();

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

  return (
    <main className="min-h-screen bg-[#FFF9F4]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-5 py-10">

        <section className="mb-8 flex flex-col gap-4 rounded-3xl border-2 border-[#C9683F] bg-[#FFF3E8] p-6 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#C9683F]">
              CUSTOM FOOTWEAR ORDERS
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#2A211C] sm:text-3xl">
              Have a different design in mind?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#76503A]">
              Upload a picture of the footwear you want us to make.
              Choose your preferred style and size, tell us your
              specifications, and we’ll send you a quotation.
            </p>
          </div>

          <Link
            href={`/custom-order?inspiration=${encodeURIComponent(
              product.name || ""
            )}`}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-[#2A211C] px-7 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-[#C9683F] focus:outline-none focus:ring-4 focus:ring-[#F4A261]/50"
          >
            Upload your preferred design →
          </Link>
        </section>

        <ProductCustomizer
          product={product}
          productParts={productParts || []}
        />

      </div>
    </main>
  );
}