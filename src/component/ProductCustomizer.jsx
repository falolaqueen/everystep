"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ShoppingBag,
  Sparkles,
  Undo2,
  Redo2,
  Upload,
  ArrowRight,
} from "lucide-react";

import { useCart } from "./CartProvider";
import SizeGuide from "./SizeGuide";
import { getEffectivePrice } from "@/lib/pricing";

const BRAND = [
  "#F4A261",
  "#E8895B",
  "#C9683F",
  "#FFD6B8",
  "#FFF3E8",
  "#8FBF9F",
  "#C9A66B",
  "#9FA8A0",
];

export default function ProductCustomizer({
  product,
  productParts = [],
  saleSettings = {},
}) {
  const router = useRouter();
  const { addItem } = useCart();

  // Product images
  const images = useMemo(
    () => (Array.isArray(product?.images) ? product.images.filter(Boolean) : []),
    [product?.images]
  );
  const original = images[0] || null;

  // Gallery
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedOriginal = images[selectedImageIndex] || original;

  // Customized image and AI history
  const [preview, setPreview] = useState(selectedOriginal);
  const [history, setHistory] = useState([]);
  const [index, setIndex] = useState(-1);

  // Colour
  const [color, setColor] = useState("#F4A261");
  const [hex, setHex] = useState("F4A261");

  // Product options
  const [size, setSize] = useState(product?.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);

  // UI
  const [loading, setLoading] = useState(false);
  const [originalMode, setOriginalMode] = useState(false);

  // Size pricing
  const sizes = useMemo(() => product?.sizes || [], [product?.sizes]);
  const extraSizes = useMemo(
    () => product?.extra_sizes || [],
    [product?.extra_sizes]
  );
  const extraSizeFee = Number(product?.extra_size_fee || 0);
  const isExtraSize = extraSizes.includes(size);

  const pricing = getEffectivePrice(product, saleSettings);
  const basePrice = pricing.final;
  const finalUnitPrice = basePrice + (isExtraSize ? extraSizeFee : 0);
  const totalPrice = finalUnitPrice * quantity;

  // Undo / redo availability
  const canUndo = index >= 0;
  const canRedo = index < history.length - 1;

  function selectImage(newIndex) {
    if (loading || newIndex < 0 || newIndex >= images.length) return;

    const newOriginal = images[newIndex];
    setSelectedImageIndex(newIndex);
    setPreview(newOriginal);
    setHistory([]);
    setIndex(-1);
    setOriginalMode(false);
  }

  function nextImage() {
    if (images.length <= 1) return;
    selectImage((selectedImageIndex + 1) % images.length);
  }

  function previousImage() {
    if (images.length <= 1) return;
    selectImage((selectedImageIndex - 1 + images.length) % images.length);
  }

  async function recolor(nextColor) {
    if (!selectedOriginal || loading) return;

    setColor(nextColor);
    setHex(nextColor.replace("#", "").toUpperCase());
    setOriginalMode(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedOriginal);
      formData.append("color", nextColor);

      const res = await fetch("/api/footwearChange", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI colour change failed.");
      }

      const nextHistory = [
        ...history.slice(0, index + 1),
        { image: data.imageUrl, color: nextColor },
      ];

      setHistory(nextHistory);
      setIndex(nextHistory.length - 1);
      setPreview(data.imageUrl);
    } catch (err) {
      console.error("AI recolor error:", err);
      alert(err.message || "Could not change the colour.");
    } finally {
      setLoading(false);
    }
  }

  function undo() {
    if (!canUndo) {
      setPreview(selectedOriginal);
      return;
    }

    const next = index - 1;
    setIndex(next);
    setPreview(next < 0 ? selectedOriginal : history[next].image);

    if (next >= 0) {
      setColor(history[next].color);
      setHex(history[next].color.replace("#", "").toUpperCase());
    }
  }

  function redo() {
    if (!canRedo) return;

    const next = index + 1;
    setIndex(next);
    setPreview(history[next].image);
    setColor(history[next].color);
    setHex(history[next].color.replace("#", "").toUpperCase());
  }

  function addToBag() {
    if (!size) {
      alert("Please choose a size.");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: finalUnitPrice,
      basePrice,
      sizeFee: isExtraSize ? extraSizeFee : 0,
      image: preview,
      originalImage: selectedOriginal,
      color,
      size,
      quantity,
    });

    router.push("/cart");
  }

  function download() {
    if (!preview) return;

    const a = document.createElement("a");
    a.href = preview;
    a.download = `${(product.name || "footwear")
      .replace(/\s+/g, "-")
      .toLowerCase()}-design.jpg`;
    a.target = "_blank";
    a.click();
  }

  const shownImage = originalMode ? selectedOriginal : preview;
  const customOrderHref = `/custom-order?inspiration=${encodeURIComponent(
    product?.name || ""
  )}`;

  return (
    <>
      {/* CUSTOM DESIGN ENTRY POINT — intentionally placed before the product UI */}
      <section
        aria-labelledby="custom-design-heading"
        className="relative z-10 mb-8 mt-6 overflow-hidden rounded-3xl border-2 border-[#C9683F] bg-[#FFF3E8] p-5 shadow-lg sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4A261] text-[#2A211C]">
              <Upload size={23} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#C9683F]">
                Custom footwear orders
              </p>
              <h2
                id="custom-design-heading"
                className="mt-1 text-xl font-black leading-tight text-[#2A211C] sm:text-2xl"
              >
                Have a different design in mind?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#76503A]">
                Upload a photo of the footwear you want us to make. Choose the
                style and size, share your specifications, and we&apos;ll review
                your request and send you a quotation.
              </p>
            </div>
          </div>

          <Link
            href={customOrderHref}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#2A211C] px-6 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-[#C9683F] focus:outline-none focus:ring-4 focus:ring-[#F4A261]/50"
          >
            Upload your preferred design
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
         <Link
            href="/custom-order"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#F4A261] px-5 py-2.5 font-extrabold text-[#2A211C] shadow-sm transition hover:bg-[#E8895B] hover:shadow-md"
          >
            <Upload size={15} strokeWidth={2.5} />
            Custom order
          </Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        {/* IMAGE AREA */}
        <div className="rounded-[2.5rem] bg-[#f1ece6] p-4">
          <div className="relative flex min-h-[540px] items-center justify-center overflow-hidden rounded-[2rem] bg-white">
            {shownImage ? (
              <img
                src={shownImage}
                alt={product.name}
                className="max-h-[680px] w-full object-contain"
              />
            ) : (
              <span className="text-7xl">👡</span>
            )}

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2a211c]/75 text-white backdrop-blur">
                <Loader2 size={34} className="animate-spin text-[#f4a261]" />
                <p className="mt-4 font-black">Making your colour...</p>
                <p className="mt-1 text-xs text-white/60">
                  What was that one beautiful moment you had? ✨
                </p>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousImage}
                  disabled={loading}
                  aria-label="Previous product photo"
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#2a211c]/80 text-white backdrop-blur transition hover:scale-105 disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  disabled={loading}
                  aria-label="Next product photo"
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#2a211c]/80 text-white backdrop-blur transition hover:scale-105 disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-[#2a211c]/80 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setOriginalMode((value) => !value)}
              disabled={loading}
              className="absolute bottom-5 right-5 rounded-full bg-[#2a211c]/90 px-4 py-2 text-xs font-black text-white disabled:opacity-40"
            >
              {originalMode ? "Show my design" : "Compare original"}
            </button>
          </div>

          {images.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-wider text-black/40">
                  Product photos
                </p>
                {images.length > 1 && (
                  <p className="text-xs text-black/30">Tap a photo to view</p>
                )}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, i) => {
                  const isSelected = i === selectedImageIndex;

                  return (
                    <button
                      key={`${image}-${i}`}
                      type="button"
                      onClick={() => selectImage(i)}
                      disabled={loading}
                      aria-label={`View product photo ${i + 1}`}
                      className={`relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-white transition ${
                        isSelected
                          ? "ring-4 ring-[#f4a261]"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#f4a261] text-[#2a211c]">
                          <Check size={13} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* PRODUCT / CUSTOMIZER PANEL */}
        <aside className="rounded-[2.5rem] bg-[#2a211c] p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#f4a261]">
            Colour playground
          </p>

          <h1 className="mt-2 text-3xl font-black">{product.name}</h1>

          <div className="mt-2">
            <p className="text-xl font-black text-[#f4a261]">
              ₦{finalUnitPrice.toLocaleString()}
            </p>
            {isExtraSize && (
              <p className="mt-1 text-xs font-bold text-[#ffd6b8]">
                Includes ₦{extraSizeFee.toLocaleString()} extra-size fee
              </p>
            )}
          </div>

          {product.allow_custom_colors && (
            <>
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-black">Choose any colour</p>
                  <Sparkles size={16} className="text-[#f4a261]" />
                </div>

                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const nextColor = e.target.value.toUpperCase();
                    setColor(nextColor);
                    setHex(nextColor.slice(1));
                  }}
                  disabled={loading}
                  className="h-20 w-full cursor-pointer rounded-2xl bg-transparent"
                />

                <div className="mt-3 flex overflow-hidden rounded-full border border-white/10 bg-white/5">
                  <span className="px-4 py-3 text-white/30">#</span>
                  <input
                    value={hex}
                    maxLength={6}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/[^0-9a-f]/gi, "")
                        .slice(0, 6)
                        .toUpperCase();

                      setHex(value);
                      if (value.length === 6) setColor(`#${value}`);
                    }}
                    className="w-full bg-transparent outline-none"
                    aria-label="Hex colour code"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {BRAND.map((brandColor) => (
                    <button
                      key={brandColor}
                      type="button"
                      onClick={() => {
                        setColor(brandColor);
                        setHex(brandColor.slice(1).toUpperCase());
                      }}
                      disabled={loading}
                      aria-label={`Select colour ${brandColor}`}
                      className="h-9 w-9 rounded-full border border-white/20 transition hover:scale-110 disabled:opacity-30"
                      style={{ background: brandColor }}
                    >
                      {color === brandColor && (
                        <Check size={14} className="mx-auto text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-400">
                Please note that Step AI is still working on changing colours
                for two-coloured footwear. At the moment, colours may be
                applied as a single colour to two-coloured footwear.
              </p>

              <button
                type="button"
                onClick={() => recolor(color)}
                disabled={
                  loading ||
                  !selectedOriginal ||
                  !/^#[0-9A-Fa-f]{6}$/.test(color)
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#f4a261] px-5 py-3.5 text-sm font-black text-[#2a211c] transition hover:bg-[#e8895b] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Changing colour...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Change footwear colour
                  </>
                )}
              </button>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo || loading}
                  className="flex-1 rounded-full border border-white/10 py-3 text-xs font-black disabled:opacity-25"
                >
                  <Undo2 className="mr-1 inline" size={14} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo || loading}
                  className="flex-1 rounded-full border border-white/10 py-3 text-xs font-black disabled:opacity-25"
                >
                  Next
                  <Redo2 className="ml-1 inline" size={14} />
                </button>
              </div>
            </>
          )}

          {/* SIZE */}
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-black">Choose size</p>
              {extraSizes.length > 0 && (
                <span className="text-xs font-bold text-[#f4a261]">
                  Some sizes cost extra
                </span>
              )}
            </div>

            {sizes.length > 0 && (
              <>
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-white/30">
                  Standard sizes
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {sizes.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSize(value)}
                      className={`rounded-xl border py-3 text-sm font-black transition ${
                        size === value
                          ? "border-[#f4a261] bg-[#f4a261] text-[#2a211c]"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </>
            )}

            {extraSizes.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-white/30">
                  Other sizes
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {extraSizes.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSize(value)}
                      className={`rounded-xl border py-3 transition ${
                        size === value
                          ? "border-[#f4a261] bg-[#f4a261] text-[#2a211c]"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span className="block text-sm font-black">{value}</span>
                      <span
                        className={`block text-[9px] font-bold ${
                          size === value
                            ? "text-[#2a211c]/60"
                            : "text-[#f4a261]"
                        }`}
                      >
                        +₦{extraSizeFee.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isExtraSize && (
              <div className="mt-3 rounded-xl bg-[#f4a261]/10 p-3 text-xs font-bold text-[#ffd6b8]">
                Size {size} has an additional ₦
                {extraSizeFee.toLocaleString()} fee.
              </div>
            )}
          </div>

          <SizeGuide availableSizes={[...sizes, ...extraSizes]} />

          {/* QUANTITY */}
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/5 p-3">
            <p className="text-sm font-black">Quantity</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                aria-label="Decrease quantity"
                className="h-8 w-8 rounded-full bg-white/10"
              >
                −
              </button>
              <span className="font-black">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => current + 1)}
                aria-label="Increase quantity"
                className="h-8 w-8 rounded-full bg-white/10"
              >
                +
              </button>
            </div>
          </div>

          {/* TOTAL */}
          <div className="mt-5 rounded-2xl bg-white/5 p-4">
            <div className="flex justify-between text-xs text-white/40">
              <span>
                {quantity} × ₦{finalUnitPrice.toLocaleString()}
              </span>
              <span>Subtotal</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-black">Total</span>
              <span className="text-2xl font-black text-[#f4a261]">
                ₦{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={download}
              className="rounded-full border border-white/10 py-3 text-xs font-black"
            >
              <Download className="mr-1 inline" size={14} />
              Save
            </button>
            <button
              type="button"
              onClick={addToBag}
              className="rounded-full bg-[#f4a261] py-3 text-xs font-black text-[#2a211c] transition hover:scale-[1.02]"
            >
              <ShoppingBag className="mr-1 inline" size={14} />
              Add to bag
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
