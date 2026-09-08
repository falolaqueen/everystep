import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import ProductCard from "@/component/ProductCard";
import Navbar from "@/component/Navbar";

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}) {
  const supabase = await createClient();

  const params = await searchParams;

  // ==============================
  // LOAD SECTIONS
  // ==============================

  const {
    data: sections,
    error: sectionError,
  } = await supabase
    .from("sections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", {
      ascending: true,
    })
    .order("name", {
      ascending: true,
    });

  if (sectionError) {
    console.error(
      "Sections loading error:",
      sectionError
    );
  }

  // ==============================
  // LOAD PRODUCTS
  // ==============================

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", {
      ascending: false,
    });

  // Existing filters
  if (params?.filter === "new") {
    query = query.eq(
      "is_new",
      true
    );
  }

  if (
    params?.filter ===
    "featured"
  ) {
    query = query.eq(
      "is_featured",
      true
    );
  }

  // ==============================
  // SECTION FILTER
  // ==============================

  if (
    params?.section &&
    params.section !== "all"
  ) {
    query = query.eq(
      "section_id",
      params.section
    );
  }

  const {
    data: products,
    error,
  } = await query;

  if (error) {
    console.error(
      "Products loading error:",
      error
    );
  }

  const activeSection =
    params?.section || "all";

  return (
    <main className="min-h-screen bg-[#FFF9F4]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-5 py-16">

        {/* =========================
            PAGE HEADING
        ========================= */}

        <div className="mt-10 max-w-2xl">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9683F]">
            Your collection
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-tight text-[#2A211C] md:text-7xl">
            Find your
            <span className="text-[#E8895B]">
              {" "}
              step.
            </span>
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-black/45">
            Handmade Nigerian footwear
            designed to move with you.
            Pick a design, make it your
            colour, choose your size and
            step into your style.
          </p>

        </div>

        {/* =========================
            SECTIONS
        ========================= */}

        <div className="mt-10">

          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-black/35">
            Shop by section
          </p>

          <div className="flex flex-wrap gap-3">

            {/* ALL */}

            <Link
              href="/shop"
              className={`rounded-full px-5 py-3 text-sm font-black transition ${
                activeSection === "all"
                  ? "bg-[#2A211C] text-white"
                  : "bg-white text-[#2A211C] hover:bg-[#F4A261]/20"
              }`}
            >
              All
            </Link>

            {/* DYNAMIC SECTIONS */}

            {sections?.map(
              (section) => (
                <Link
                  key={section.id}
                  href={`/shop?section=${section.id}`}
                  className={`rounded-full px-5 py-3 text-sm font-black transition ${
                    activeSection ===
                    section.id
                      ? "bg-[#2A211C] text-white"
                      : "bg-white text-[#2A211C] hover:bg-[#F4A261]/20"
                  }`}
                >
                  {section.name}
                </Link>
              )
            )}

          </div>

        </div>

        {/* =========================
            PRODUCTS
        ========================= */}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {products?.length ? (
            products.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              )
            )
          ) : (
            <div className="col-span-full rounded-[2rem] bg-white p-16 text-center">

              <p className="text-5xl">
                👡
              </p>

              <h2 className="mt-5 text-2xl font-black">
                No products here yet.
              </h2>

              <p className="mt-2 text-black/40">
                Add products to this section
                from the admin dashboard.
              </p>

            </div>
          )}

        </div>

      </section>
    </main>
  );
}