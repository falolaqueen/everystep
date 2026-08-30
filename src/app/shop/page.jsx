import { createClient } from "../../lib/supabase/server";
// import ProductCard from "../../components/ProductCard";
import ProductCard from "@/component/ProductCard";
// import Navbar from "../../components/Navbar";
import Navbar from "@/component/Navbar";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}) {
  const supabase =
    await createClient();

  const params =
    await searchParams;

  let query =
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

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

  const { data: products, error } =
    await query;

  if (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-[#FFF9F4]">

      <Navbar />

      <section className="mx-auto max-w-7xl px-5 py-16">

        <div className="max-w-2xl mt-10">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9683F]">
            The collection
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-tight text-[#2A211C] md:text-7xl">
            Find your
            <span className="text-[#E8895B]">
              {" "}step.
            </span>
          </h1>

          <p className="mt-5 max-w-lg leading-7 text-black/45">
            Handmade Nigerian footwear
            designed to move with you.
            Pick a design, make it your
            colour, choose your size and
            make it yours.
          </p>

        </div>

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
                Your collection is
                coming together.
              </h2>

              <p className="mt-2 text-black/40">
                Add your first product
                from the admin dashboard.
              </p>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}