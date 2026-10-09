import StyleMyStepsLink from "@/component/StyleMyStepsLink";
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import ProductCard from "@/component/ProductCard";
import Navbar from "@/component/Navbar";
import { productBelongsToSection } from "@/lib/pricing";

export const revalidate = 60;

export default async function ShopPage({ searchParams }) {
  const supabase = await createClient();
  const params = (await searchParams) || {};
  const activeSection = typeof params.section === "string" ? params.section : "all";
  const activeFilter = typeof params.filter === "string" ? params.filter : "";
  const search = typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";

  const [{ data: sections, error: sectionError }, { data: allProducts, error: productError }, { data: saleSettings, error: settingsError }] = await Promise.all([
    supabase.from("sections").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("store_settings").select("sale_enabled,sale_percent").eq("id", 1).maybeSingle(),
  ]);

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

        <StyleMyStepsLink />
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
          {products.length ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} saleSettings={saleSettings || { sale_enabled: false, sale_percent: 0 }} />
            ))
          ) : (
            <div className="col-span-full rounded-[2rem] bg-white p-16 text-center">
              <p className="text-5xl">👡</p>
              <h2 className="mt-5 text-2xl font-black">{search ? "No matching footwear found." : "No products here yet."}</h2>
              <p className="mt-2 text-black/40">{search ? "Try another name or category, or clear your search." : "Add products to this section from the admin dashboard."}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
