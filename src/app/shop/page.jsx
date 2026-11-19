import Link from "next/link";
import ProductCard from "@/component/ProductCard";
import Navbar from "@/component/Navbar";
import { productBelongsToSection } from "@/lib/pricing";

export const revalidate = 60;

async function fetchPublicTable(table, query) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !key) {
    return {
      data: null,
      error: new Error("Supabase URL or public key is missing from the local environment."),
    };
  }

  try {
    const url = new URL(`/rest/v1/${table}`, base);
    Object.entries(query).forEach(([name, value]) => {
      url.searchParams.set(name, value);
    });

    // Public catalogue data is safe to cache briefly. This avoids making
    // three fresh database round trips every time a visitor opens the shop.
    const response = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      next: { revalidate: 60 },
    });

    const raw = await response.text();
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      // Keep the database response below as a readable error.
    }

    if (!response.ok) {
      return {
        data: null,
        error: new Error(`Supabase ${table} request failed (${response.status}).`),
      };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export default async function ShopPage({ searchParams }) {
  const params = (await searchParams) || {};
  const activeSection = typeof params.section === "string" ? params.section : "all";
  const activeFilter = typeof params.filter === "string" ? params.filter : "";
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";

  // Keep the shop response small and cache public catalogue data briefly.
  // Listing cards do not need the full product/customization records.
  const [sectionResult, productResult, settingsResult] = await Promise.all([
    fetchPublicTable("sections", {
      select: "id,name,sort_order",
      is_active: "eq.true",
      order: "sort_order.asc,name.asc",
    }),
    fetchPublicTable("products", {
      select: "id,name,slug,price,sale_price,sale_percent,images,is_new,is_featured,category,description,section_id,section_ids",
      is_active: "eq.true",
      order: "created_at.desc",
      limit: "200",
    }),
    fetchPublicTable("store_settings", {
      select: "sale_enabled,sale_percent",
      id: "eq.1",
      limit: "1",
    }),
  ]);

  const { data: sections, error: sectionError } = sectionResult;
  const { data: allProducts, error: productError } = productResult;
  const { data: settingsRows, error: settingsError } = settingsResult;
  const saleSettings = Array.isArray(settingsRows) ? settingsRows[0] : null;

  if (sectionError) console.error("Sections loading error:", sectionError);
  if (productError) console.error("Products loading error:", productError);
  if (settingsError) console.error("Sale settings loading error:", settingsError);

  const products = (allProducts || []).filter((product) => {
    if (activeFilter === "new" && !product.is_new) return false;
    if (activeFilter === "featured" && !product.is_featured) return false;
    if (activeSection !== "all" && !productBelongsToSection(product, activeSection)) return false;
    if (!search) return true;
    const needle = search.toLocaleLowerCase();
    return [product.name, product.category, product.description].some((value) =>
      String(value || "").toLocaleLowerCase().includes(needle)
    );
  });

  const shopHref = (section = "all", includeSearch = true) => {
    const query = new URLSearchParams();
    if (section !== "all") query.set("section", section);
    if (activeFilter) query.set("filter", activeFilter);
    if (search && includeSearch) query.set("q", search);
    const qs = query.toString();
    return `/shop${qs ? `?${qs}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-[#FFF9F4]">
      <Navbar />
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="mt-10 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9683F]">Your collection</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-[#2A211C] md:text-7xl">
            Find your<span className="text-[#E8895B]"> step.</span>
          </h1>
          <p className="mt-5 max-w-lg leading-7 text-black/45">
            Handmade Nigerian footwear designed to move with you. Pick a design, make it your colour, choose your size and step into your style.
          </p>
        </div>

        <Link
          href="/custom-order"
          className="my-8 block rounded-[2rem] bg-[#2a211c] px-7 py-6 text-white"
        >
          <span className="text-xs font-black uppercase tracking-widest text-[#f4a261]">
            Your design, your steps
          </span>
          <span className="mt-2 block text-2xl font-black">
            Upload your preferred design
          </span>
          <span className="mt-2 block text-sm text-white/70">
            Share a picture of the footwear you want us to make →
          </span>
        </Link>
        {/* GET search keeps the page server-rendered, and works without JavaScript. */}
        <form action="/shop" method="GET" className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
          {activeSection !== "all" && <input type="hidden" name="section" value={activeSection} />}
          {activeFilter && <input type="hidden" name="filter" value={activeFilter} />}
          <label htmlFor="shop-search" className="sr-only">Search products</label>
          <input
            id="shop-search"
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search footwear by name, category or description..."
            className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-6 py-4 text-sm text-[#2A211C] outline-none focus:border-[#E8895B]"
          />
          <button type="submit" className="rounded-full bg-[#F4A261] px-7 py-4 text-sm font-black text-[#2A211C] transition hover:bg-[#E8895B]">Search</button>
          {search && <Link href={shopHref(activeSection, false)} className="self-center text-sm font-bold text-[#C9683F] underline">Clear</Link>}
        </form>

        <div className="mt-10">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-black/35">Shop by section</p>
          <div className="flex flex-wrap gap-3">
            <Link href={shopHref("all")} className={`rounded-full px-5 py-3 text-sm font-black transition ${activeSection === "all" ? "bg-[#2A211C] text-white" : "bg-white text-[#2A211C] hover:bg-[#F4A261]/20"}`}>All</Link>
            {(sections || []).map((section) => (
              <Link key={section.id} href={shopHref(section.id)} className={`rounded-full px-5 py-3 text-sm font-black transition ${activeSection === section.id ? "bg-[#2A211C] text-white" : "bg-white text-[#2A211C] hover:bg-[#F4A261]/20"}`}>
                {section.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productError ? (
            <div className="col-span-full rounded-[2rem] bg-white p-10 text-center">
              <h2 className="text-xl font-black text-[#2A211C]">We couldn’t load the collection.</h2>
              <p className="mt-2 text-sm text-black/50">Please refresh in a moment. If this keeps happening on localhost, check that your local Supabase environment variables point to the same project as the live store.</p>
            </div>
          ) : products.length ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} saleSettings={saleSettings || { sale_enabled: false, sale_percent: 0 }} />
            ))
          ) : (
            <div className="col-span-full rounded-[2rem] bg-white p-16 text-center">
              <p className="text-5xl">👡</p>
              <h2 className="mt-5 text-2xl font-black">{search ? "No matching footwear found." : "No products here yet."}</h2>
              <p className="mt-2 text-black/40">{search ? "Try another name or category, or clear your search." : "No active products were returned by this Supabase project. If they appear on the live site, check that .env.local points to the same Supabase project."}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}