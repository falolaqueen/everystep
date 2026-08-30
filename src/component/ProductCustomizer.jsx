 "use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Download, Loader2, ShoppingBag, Sparkles, Undo2, Redo2 } from "lucide-react";
import { useCart } from "./CartProvider";

const BRAND = ["#F4A261","#E8895B","#C9683F","#FFD6B8","#FFF3E8","#8FBF9F","#C9A66B","#9FA8A0"];

export default function ProductCustomizer({ product }) {
     const router = useRouter();
  const original = product.images?.[0] || null;
  const [preview, setPreview] = useState(original);
  const [history, setHistory] = useState([]);
  const [index, setIndex] = useState(-1);
  const [color, setColor] = useState("#F4A261");
  const [hex, setHex] = useState("F4A261");
  const [size, setSize] = useState(product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [originalMode, setOriginalMode] = useState(false);
  const { addItem } = useCart();

  const canUndo = index >= 0;
  const canRedo = index < history.length - 1;

  async function recolor(nextColor) {
    if (!original || loading) return;
    setColor(nextColor);
    setHex(nextColor.replace("#","").toUpperCase());
    setOriginalMode(false);
    setLoading(true);

    try {
      const res = await fetch("/api/footwearChange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: original, color: nextColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI colour change failed.");

      const nextHistory = [...history.slice(0, index + 1), { image: data.imageUrl, color: nextColor }];
      setHistory(nextHistory);
      setIndex(nextHistory.length - 1);
      setPreview(data.imageUrl);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function undo() {
    if (!canUndo) { setPreview(original); return; }
    const next = index - 1;
    setIndex(next);
    setPreview(next < 0 ? original : history[next].image);
    if (next >= 0) {
      setColor(history[next].color);
      setHex(history[next].color.replace("#","").toUpperCase());
    }
  }

  function redo() {
    if (!canRedo) return;
    const next = index + 1;
    setIndex(next);
    setPreview(history[next].image);
    setColor(history[next].color);
    setHex(history[next].color.replace("#","").toUpperCase());
  }

  function addToBag() {
    if (!size) return alert("Please choose a size.");
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: preview,
      originalImage: original,
      color,
      size,
      quantity,
    });
    router.push("/cart")
  }

  function download() {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = `${product.name.replace(/\s+/g,"-").toLowerCase()}-design.jpg`;
    a.target = "_blank";
    a.click();
  }

  const shownImage = originalMode ? original : preview;
  const sizes = useMemo(() => product.sizes || [], [product.sizes]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
      <div className="rounded-[2.5rem] bg-[#f1ece6] p-4">
        <div className="relative flex min-h-[540px] items-center justify-center overflow-hidden rounded-[2rem] bg-white">
          {shownImage ? <img src={shownImage} alt={product.name} className="max-h-[680px] w-full object-contain" /> : <span className="text-7xl">👡</span>}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2a211c]/75 text-white backdrop-blur">
              <Loader2 size={34} className="animate-spin text-[#f4a261]" />
              <p className="mt-4 font-black">Making your colour...</p>
            </div>
          )}
          <button onClick={() => setOriginalMode(v => !v)} className="absolute bottom-5 right-5 rounded-full bg-[#2a211c]/90 px-4 py-2 text-xs font-black text-white">
            {originalMode ? "Show my design" : "Compare original"}
          </button>
        </div>
      </div>

      <aside className="rounded-[2.5rem] bg-[#2a211c] p-6 text-white sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#f4a261]">Colour playground</p>
        <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
        <p className="mt-2 text-xl font-black text-[#f4a261]">₦{Number(product.price).toLocaleString()}</p>

        {product.allow_custom_colors && (
          <>
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-black">Choose any colour</p>
                <Sparkles size={16} className="text-[#f4a261]" />
              </div>
              <input type="color" value={color} onChange={e => recolor(e.target.value)} disabled={loading} className="h-20 w-full cursor-pointer rounded-2xl bg-transparent" />
              <div className="mt-3 flex overflow-hidden rounded-full border border-white/10 bg-white/5">
                <span className="px-4 py-3 text-white/30">#</span>
                <input value={hex} maxLength={6} onChange={e => {
                  const v=e.target.value.replace(/[^0-9a-f]/gi,"").slice(0,6).toUpperCase();
                  setHex(v);
                  if(v.length===6) recolor(`#${v}`);
                }} className="w-full bg-transparent outline-none" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {BRAND.map(c => <button key={c} onClick={() => recolor(c)} className="h-9 w-9 rounded-full border border-white/20" style={{background:c}}>{color===c && <Check size={14} className="mx-auto text-white"/>}</button>)}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={undo} disabled={!canUndo} className="flex-1 rounded-full border border-white/10 py-3 text-xs font-black disabled:opacity-25"><Undo2 className="mr-1 inline" size={14}/> Previous</button>
              <button onClick={redo} disabled={!canRedo} className="flex-1 rounded-full border border-white/10 py-3 text-xs font-black disabled:opacity-25">Next <Redo2 className="ml-1 inline" size={14}/></button>
            </div>
          </>
        )}

        <div className="mt-7">
          <p className="mb-3 font-black">Choose size</p>
          <div className="grid grid-cols-4 gap-2">
            {sizes.map(s => <button key={s} onClick={() => setSize(s)} className={`rounded-xl border py-3 text-sm font-black ${size===s ? "border-[#f4a261] bg-[#f4a261] text-[#2a211c]" : "border-white/10 bg-white/5"}`}>{s}</button>)}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/5 p-3">
          <p className="text-sm font-black">Quantity</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setQuantity(q => Math.max(1,q-1))} className="h-8 w-8 rounded-full bg-white/10">−</button>
            <span className="font-black">{quantity}</span>
            <button onClick={() => setQuantity(q => q+1)} className="h-8 w-8 rounded-full bg-white/10">+</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={download} className="rounded-full border border-white/10 py-3 text-xs font-black"><Download className="mr-1 inline" size={14}/> Save</button>
          <button onClick={addToBag} className="rounded-full bg-[#f4a261] py-3 text-xs font-black text-[#2a211c]"><ShoppingBag className="mr-1 inline" size={14}/> Add to bag</button>
        </div>
      </aside>
    </div>
  );
}