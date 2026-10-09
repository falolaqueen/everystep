"use client";

import { useEffect, useState } from "react";

export function firstImage(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const item = images.find(Boolean);
  if (typeof item === "string") return item;
  if (item && typeof item === "object") return item.url || item.src || item.publicUrl || "";
  return "";
}

export default function FootwearCatalogue({ onSelect, selectedUrl = "", disabled = false }) {
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/tryOnProducts", { cache: "no-store" })
      .then(async (response) => {
        const type = response.headers.get("content-type") || "";
        if (!type.includes("application/json")) {
          throw new Error(`Products endpoint returned a page instead of JSON (${response.status}). Check src/app/api/tryOnProducts/route.js and restart the server.`);
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load products.");
        return data.products || [];
      })
      .then((data) => { if (active) setProducts(data.filter((p) => firstImage(p))); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="mt-4">
      {busy && <p className="text-xs opacity-60">Loading Every Step products…</p>}
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
      {!busy && !error && !products.length && <p className="text-xs opacity-60">No active footwear products with images yet. You can upload your own.</p>}
      {products.length > 0 && (
        <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {products.map((item) => {
            const url = firstImage(item);
            const selected = selectedUrl === url;
            return (
              <button key={item.id} type="button" disabled={disabled} onClick={() => onSelect(item, url)}
                aria-pressed={selected}
                className={`overflow-hidden rounded-2xl border-2 bg-white text-left transition disabled:opacity-40 ${selected ? "border-[#e8895b]" : "border-transparent"}`}>
                <img src={url} alt={item.name} className="h-28 w-full bg-[#fff9f4] object-contain" />
                <div className="p-2 text-[#2a211c]">
                  <p className="truncate text-xs font-bold">{item.name}</p>
                  <p className="text-xs text-[#c9683f]">₦{Number(item.price || 0).toLocaleString()}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}