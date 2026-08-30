import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
// import Navbar from "../../../components/Navbar";
import Navbar from "@/component/Navbar";
import ProductCustomizer from "@/component/ProductCustomizer";
// import ProductCustomizer from "../../../components/ProductCustomizer";

export const dynamic =
  "force-dynamic";

export default async function ProductPage({
  params,
}) {
  const { slug } =
    await params;

  const supabase =
    await createClient();

  const {
    data: product,
    error,
  } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (
    error ||
    !product
  ) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#FFF9F4]">

      <Navbar />

      <div className="mx-auto max-w-7xl px-5 py-10">

        <ProductCustomizer
          product={product}
        />

      </div>

    </main>
  );
}