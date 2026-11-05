"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/component/Navbar";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export default function CustomOrderPage() {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    whatsapp: "+234",
    category: "",
    solePreference: "",
    styleRange: "",
    size: "",
    quantity: "1",
    specifications: "",
  });

  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setCategoriesLoading(true);

      try {
        const response = await fetch("/api/custom-designs", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Unable to load categories."
          );
        }

        if (!Array.isArray(result.categories)) {
          throw new Error("Invalid category response.");
        }

        const adminCategories = result.categories
          .filter((category) => {
            const name = String(category.name || "")
              .trim()
              .toLowerCase();

            return (
              name &&
              name !== "foreign soles" &&
              name !== "nigerian soles" &&
              category.is_active !== false
            );
          })
          .map((category) => ({
            ...category,
            name: String(category.name).trim(),
          }));

        if (!active) return;

        setCategories(adminCategories);

        setForm((current) => ({
          ...current,
          category: adminCategories.some(
            (category) => category.name === current.category
          )
            ? current.category
            : adminCategories[0]?.name || "",
        }));

        if (!adminCategories.length) {
          setError(
            "No footwear categories are currently available. Please try again later."
          );
        } else {
          setError("");
        }
      } catch (err) {
        if (active) {
          setCategories([]);
          setError(
            err.message ||
              "Unable to load footwear categories. Please refresh."
          );
        }
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const inspiration = params.get("inspiration");

    if (inspiration) {
      setForm((current) => ({
        ...current,
        specifications:
          `I would like a custom design inspired by: ${inspiration}.\n\n`,
      }));
    }

    loadCategories();

    const handleFocus = () => loadCategories();

    window.addEventListener("focus", handleFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => category.name === form.category
      ),
    [categories, form.category]
  );

  const quantity = Math.max(
    1,
    Math.min(10, Number(form.quantity) || 1)
  );

  const pricePreview = useMemo(() => {
    if (!selectedCategory) return null;

    const nigeriaPrice = Math.max(
      0,
      Number(selectedCategory.nigeria_sole_price) || 0
    );

    const foreignPrice = Math.max(
      0,
      Number(selectedCategory.foreign_sole_price) || 0
    );

    if (!nigeriaPrice && !foreignPrice) {
      return { unavailable: true };
    }

    if (form.solePreference === "Nigerian soles") {
      return {
        type: "single",
        price: nigeriaPrice,
        total: nigeriaPrice * quantity,
      };
    }

    if (form.solePreference === "Foreign soles") {
      return {
        type: "single",
        price: foreignPrice,
        total: foreignPrice * quantity,
      };
    }

    const availablePrices = [
      nigeriaPrice,
      foreignPrice,
    ].filter((price) => price > 0);

    return {
      type: "range",
      minimum: Math.min(...availablePrices),
      maximum: Math.max(...availablePrices),
      minimumTotal: Math.min(...availablePrices) * quantity,
      maximumTotal: Math.max(...availablePrices) * quantity,
    };
  }, [selectedCategory, form.solePreference, quantity]);

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  function choosePhotos(event) {
    const files = Array.from(event.target.files || []);

    if (files.length > 3) {
      setError("Choose a maximum of 3 photos.");
      event.target.value = "";
      return;
    }

    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(
            file.type
          ) || file.size > 4_000_000
      )
    ) {
      setError(
        "Each photo must be JPG, PNG or WebP and under 4 MB."
      );
      event.target.value = "";
      return;
    }

    setError("");
    setPhotos(files);
  }

  async function submit(event) {
    event.preventDefault();

    if (categoriesLoading) {
      setError("Please wait for footwear categories to load.");
      return;
    }

    if (!categories.some((c) => c.name === form.category)) {
      setError("Please select a valid footwear category.");
      return;
    }

    if (!form.solePreference) {
      setError("Please select your sole preference.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const body = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        body.append(key, value);
      });

      photos.forEach((file) => {
        body.append("photos", file);
      });

      const response = await fetch("/api/custom-designs", {
        method: "POST",
        body,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to submit your design."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF9F4] text-[#2A211C]">
      <Navbar />

      <section className="mx-auto max-w-3xl px-5 pb-20 pt-32">
        <Link
          href="/shop"
          className="text-sm font-bold text-[#C9683F]"
        >
          ← Back to shop
        </Link>

        {success ? (
          <div className="mt-8 rounded-[2rem] bg-white p-8 text-center shadow-sm sm:p-12">
            <p className="text-5xl">🧡</p>

            <h1 className="mt-5 text-3xl font-black">
              Your design request is in!
            </h1>

            <p className="mx-auto mt-3 max-w-lg leading-7 text-black/55">
              Our team will review your photos and specifications,
              check material availability and prepare a quotation.
              We’ll contact you on the WhatsApp number you provided
              before production begins.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex rounded-full bg-[#2A211C] px-7 py-3 font-black text-white"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#C9683F]">
              Made around your idea
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Create your own steps.
            </h1>

            <p className="mt-4 leading-7 text-black/55">
              Share a picture of the footwear you want, tell us the
              details and we’ll review it and send you a quotation.
              Every custom order is confirmed with you before we begin.
            </p>

            <form
              onSubmit={submit}
              className="mt-9 space-y-6 rounded-[2rem] bg-white p-5 shadow-sm sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Your name

                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Full name"
                    className="mt-2 w-full rounded-xl bg-[#FFF8F1] px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#F4A261]"
                  />
                </label>

                <label className="text-sm font-bold">
                  WhatsApp number

                  <input
                    required
                    maxLength={40}
                    value={form.whatsapp}
                    onChange={(e) =>
                      update("whatsapp", e.target.value)
                    }
                    placeholder="+234 801 234 5678"
                    className="mt-2 w-full rounded-xl bg-[#FFF8F1] px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#F4A261]"
                  />

                  <span className="mt-1 block text-xs font-normal text-black/45">
                    Include your country code so we can reach you.
                  </span>
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Footwear category

                  <select
                    required
                    value={form.category}
                    disabled={
                      categoriesLoading || categories.length === 0
                    }
                    onChange={(e) =>
                      update("category", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-[#FFF8F1] px-4 py-3 font-normal disabled:opacity-50"
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Loading categories..."
                        : categories.length
                          ? "Select a category"
                          : "No categories available"}
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id || category.name}
                        value={category.name}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <span className="mt-1 block text-xs font-normal text-black/45">
                    Categories are managed from the Admin Dashboard.
                  </span>
                </label>

                <label className="text-sm font-bold">
                  Sole preference

                  <select
                    required
                    value={form.solePreference}
                    onChange={(e) =>
                      update("solePreference", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-[#FFF8F1] px-4 py-3 font-normal"
                  >
                    <option value="">Select sole preference</option>
                    <option value="Foreign soles">
                      Foreign soles
                    </option>
                    <option value="Nigerian soles">
                      Nigerian soles
                    </option>
                    <option value="No preference">
                      No preference
                    </option>
                  </select>
                </label>
              </div>

              {/* LIVE SOLE PRICE PREVIEW */}
              {form.category && form.solePreference && (
                <div className="rounded-2xl border border-[#F4A261]/40 bg-[#FFF3E8] p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-[#C9683F]">
                    Estimated sole price
                  </p>

                  {!pricePreview || pricePreview.unavailable ? (
                    <p className="mt-2 text-sm text-[#76503A]">
                      Pricing for this category has not been set yet.
                      We’ll confirm the price after reviewing your request.
                    </p>
                  ) : pricePreview.type === "single" ? (
                    <>
                      <p className="mt-2 text-2xl font-black">
                        {formatPrice(pricePreview.price)}
                        <span className="ml-1 text-sm font-normal text-black/50">
                          per pair
                        </span>
                      </p>

                      <p className="mt-1 text-sm text-black/60">
                        {quantity} pair{quantity > 1 ? "s" : ""}:{" "}
                        <strong>
                          {formatPrice(pricePreview.total)}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-2xl font-black">
                        {formatPrice(pricePreview.minimum)} –{" "}
                        {formatPrice(pricePreview.maximum)}
                      </p>

                      <p className="mt-1 text-xs text-black/50">
                        Estimated price per pair
                      </p>

                      <p className="mt-2 text-sm text-black/60">
                        {quantity} pair{quantity > 1 ? "s" : ""}:{" "}
                        <strong>
                          {formatPrice(pricePreview.minimumTotal)} –{" "}
                          {formatPrice(pricePreview.maximumTotal)}
                        </strong>
                      </p>
                    </>
                  )}

                 
                </div>
              )}

              <label className="block text-sm font-bold">
                Style / range (optional)

                <input
                  maxLength={100}
                  value={form.styleRange}
                  onChange={(e) =>
                    update("styleRange", e.target.value)
                  }
                  placeholder="e.g. luxury, everyday, bridal"
                  className="mt-2 w-full rounded-xl bg-[#FFF8F1] px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#F4A261]"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold">
                  Footwear size

                  <input
                    required
                    maxLength={30}
                    value={form.size}
                    onChange={(e) => update("size", e.target.value)}
                    placeholder="e.g. 40 / UK 7"
                    className="mt-2 w-full rounded-xl bg-[#FFF8F1] px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#F4A261]"
                  />
                </label>

                <label className="text-sm font-bold">
                  Number of pairs

                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={form.quantity}
                    onChange={(e) =>
                      update("quantity", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl bg-[#FFF8F1] px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#F4A261]"
                  />
                </label>
              </div>

              <label className="block text-sm font-bold">
                Reference photos{" "}
                <span className="font-normal text-black/40">
                  (up to 3; optional)
                </span>

                <div className="mt-2 rounded-2xl border-2 border-dashed border-[#E9C9B2] bg-[#FFF9F4] p-5 text-center">
                  <span className="text-2xl">📷</span>

                  <span className="mt-2 block text-sm font-bold">
                    Upload your design inspiration
                  </span>

                  <span className="mt-1 block text-xs font-normal text-black/45">
                    JPG, PNG or WebP · max 4 MB each
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={choosePhotos}
                    className="mt-4 block w-full text-sm font-normal"
                  />
                </div>
              </label>

              {photos.length > 0 && (
                <p className="text-xs text-black/55">
                  Selected: {photos.map((f) => f.name).join(", ")}
                </p>
              )}

              <label className="block text-sm font-bold">
                Tell us exactly what you want

                <textarea
                  required
                  minLength={10}
                  maxLength={1800}
                  rows={5}
                  value={form.specifications}
                  onChange={(e) =>
                    update("specifications", e.target.value)
                  }
                  placeholder="Describe the sole, straps, heel height, colour, material, finishing, comfort preferences and any other details..."
                  className="mt-2 w-full rounded-xl bg-[#FFF8F1] px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[#F4A261]"
                />
              </label>

              <div className="rounded-2xl bg-[#FFF3E8] p-4 text-sm leading-6 text-[#76503A]">
                Submitting this request is not a purchase or payment.
                We’ll first check the design, materials and production
                cost, then send you a quotation on WhatsApp. Work begins
                only after you approve the quote.
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  busy ||
                  categoriesLoading ||
                  categories.length === 0
                }
                className="w-full rounded-full bg-[#F4A261] px-6 py-4 font-black text-[#2A211C] transition hover:bg-[#E8895B] disabled:opacity-50"
              >
                {busy
                  ? "Submitting your design..."
                  : categoriesLoading
                    ? "Loading categories..."
                    : "Submit custom design request →"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}