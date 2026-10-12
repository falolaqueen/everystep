"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import { Camera, Download, LoaderCircle, RefreshCcw, Sparkles, X } from "lucide-react";

import FootwearCatalogue, { firstImage } from "./FootwearCatalogue";



const MAX_BYTES = 8 * 1024 * 1024;

const TYPES = ["image/jpeg", "image/png", "image/webp"];

const valid = (file) => file && TYPES.includes(file.type) && file.size > 0 && file.size <= MAX_BYTES;



export default function VirtualTryOn({ product = null, footwearImage = null }) {

  const images = useMemo(() => {

    const raw = Array.isArray(product?.images) ? product.images : [];

    const urls = raw.map((x) => typeof x === "string" ? x : (x?.url || x?.src || x?.publicUrl || ""));

    return [...new Set([footwearImage, ...urls, firstImage(product)].filter(Boolean))];

  }, [product?.images, footwearImage]);

  const [selectedImage, setSelectedImage] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(product);

  const [footwearFile, setFootwearFile] = useState(null);

  const [footwearPreview, setFootwearPreview] = useState("");

  const [feetFile, setFeetFile] = useState(null);

  const [feetPreview, setFeetPreview] = useState("");

  const [result, setResult] = useState("");

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);

  const [showCatalogue, setShowCatalogue] = useState(false);
  const maskCanvas = useRef(null);
  const overlayCanvas = useRef(null);
  const painting = useRef(false);
  const lastPoint = useRef(null);
  const [painted, setPainted] = useState(false);
  const [brush, setBrush] = useState(65);
  const [maskReady, setMaskReady] = useState(false);

  function initializeMask(img) {
    if (!img || !maskCanvas.current || !overlayCanvas.current) return;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) return;
    for (const canvas of [maskCanvas.current, overlayCanvas.current]) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = maskCanvas.current.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    setPainted(false);
    setMaskReady(true);
  }

  function clearMask() {
    const canvas = maskCanvas.current;
    const overlay = overlayCanvas.current;
    if (!canvas || !overlay) return;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    overlay.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
    setPainted(false);
  }

  function paint(event) {
    if (!painting.current || !maskCanvas.current || !overlayCanvas.current) return;
    const canvas = overlayCanvas.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    const point = { x, y };
    const size = (brush / 1000) * Math.max(canvas.width, canvas.height);
    const previous = lastPoint.current || point;
    for (const [target, operation, color] of [
      [maskCanvas.current, "destination-out", "rgba(0,0,0,1)"],
      [overlayCanvas.current, "source-over", "rgba(232,137,91,0.48)"],
    ]) {
      const ctx = target.getContext("2d");
      ctx.globalCompositeOperation = operation;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPoint.current = point;
    setPainted(true);
  }




  useEffect(() => {
    // Only sync a changed parent product, never overwrite a catalogue selection
    // because a parent component rendered again.
    if (footwearFile) return;
    const incoming = footwearImage || images[0] || "";
    setSelectedImage(incoming);
    setSelectedProduct(product);
    setResult("");
  }, [footwearImage, product?.id, product?.slug]);

  useEffect(() => {

    if (!feetFile) { setFeetPreview(""); setMaskReady(false); return; }
    setMaskReady(false); setPainted(false);

    const url = URL.createObjectURL(feetFile);

    setFeetPreview(url);

    return () => URL.revokeObjectURL(url);

  }, [feetFile]);

  useEffect(() => {

    if (!footwearFile) { setFootwearPreview(""); return; }

    const url = URL.createObjectURL(footwearFile);

    setFootwearPreview(url);

    return () => URL.revokeObjectURL(url);

  }, [footwearFile]);



  function upload(event, kind) {

    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setError(""); setResult("");

    if (!valid(file)) { setError("Choose a JPG, PNG or WebP photo smaller than 8 MB."); return; }

    if (kind === "feet") setFeetFile(file);

    else { setFootwearFile(file); setSelectedImage(""); setSelectedProduct(null); }

  }



  function select(url, chosenProduct = product) {

    setSelectedImage(url);

    setSelectedProduct(chosenProduct);

    setFootwearFile(null);

    setResult(""); setError("");

  }



  async function generate() {

    if (busy) return;

    if (!feetFile) { setError("Upload a clear photo of your feet."); return; }

    if (!footwearFile && !selectedImage) { setError("Select a product or upload footwear."); return; }

    setBusy(true); setError(""); setResult("");

    try {

      const form = new FormData();

      if (!painted || !maskCanvas.current || !maskReady) {
        throw new Error("Paint over both feet where the footwear should appear before generating.");
      }
      const maskBlob = await new Promise((resolve) => maskCanvas.current.toBlob(resolve, "image/png"));
      if (!maskBlob) throw new Error("Could not prepare the footwear mask.");
      form.append("feetPhoto", feetFile);
      form.append("maskPhoto", new File([maskBlob], "footwear-mask.png", { type: "image/png" }));

      if (footwearFile) {

        form.append("footwearPhoto", footwearFile);

      } else if (selectedImage.startsWith("data:image/")) {

        const response = await fetch(selectedImage);

        const blob = await response.blob();

        if (blob.size > MAX_BYTES) throw new Error("Your customised image exceeds 8 MB.");

        form.append("footwearPhoto", new File([blob], "custom-footwear.png", { type: blob.type || "image/png" }));

      } else {

        form.append("productImage", selectedImage);

      }

      form.append("productName", selectedProduct?.name || product?.name || "footwear");

      const response = await fetch("/api/virtualTryOn", { method: "POST", body: form });

      const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const body = await response.text();
          if (response.status === 404 || body.includes("This page could not be found")) {
            throw new Error("Virtual Try-On API was not found (404). Check that src/app/api/virtualTryOn/route.js is deployed to Vercel.");
          }
          throw new Error(`Virtual Try-On returned HTTP ${response.status} instead of JSON. Check your Vercel deployment and function logs.`);
        }
        const data = await response.json();
        if (!response.ok || !data?.imageUrl) {
          throw new Error(data?.error || `Virtual Try-On failed (HTTP ${response.status}).`);
        }

      setResult(data.imageUrl);

    } catch (err) { setError(err.message || "Unable to create your try-on."); }

    finally { setBusy(false); }

  }



  function download() {

    if (!result) return;

    const a = document.createElement("a");

    a.href = result;

    a.download = `every-step-try-on-${selectedProduct?.slug || product?.slug || "preview"}.png`;

    document.body.appendChild(a); a.click(); a.remove();

  }



  return (

    <section className="mt-8 rounded-[2rem] border border-[#f4d9c4] bg-white p-5 shadow-sm sm:p-8">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c9683f]">Every Step AI</p>

          <h2 className="mt-2 text-2xl font-black text-[#2a211c] sm:text-3xl">See it on you 👣</h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#80695d]">Upload a photo of your feet and preview this pair on you before ordering.</p>

        </div>

        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-full bg-[#e8895b] px-6 py-3 text-sm font-black text-white transition hover:bg-[#d97745]">

          {open ? "Close try-on" : "Try it on ✨"}

        </button>

      </div>

      {open && (

        <div className="mt-7 border-t border-[#f4e3d7] pt-7">

          <p className="mb-4 text-sm font-bold text-[#2a211c]">1. Choose the footwear photo</p>

          {images.length > 0 && (

            <div className="mb-4 flex flex-wrap gap-3">

              {images.map((url, i) => (

                <button key={`${url}-${i}`} type="button" onClick={() => select(url)} aria-label={`Use footwear photo ${i + 1}`} aria-pressed={!footwearFile && selectedImage === url}

                  className={`h-24 w-24 overflow-hidden rounded-2xl border-2 bg-[#fff9f4] ${!footwearFile && selectedImage === url ? "border-[#e8895b]" : "border-transparent"}`}>

                  <img src={url} alt={`Footwear view ${i + 1}`} className="h-full w-full object-contain" />

                </button>

              ))}

            </div>

          )}

          <button type="button" onClick={() => setShowCatalogue((value) => !value)} disabled={busy}

            className="mb-4 rounded-full border border-[#e8895b] px-5 py-3 text-sm font-black text-[#2a211c] disabled:opacity-40">

            Select from our products

          </button>

          {showCatalogue && (

            <div className="mb-4 rounded-2xl bg-[#fff9f4] p-4">

              <FootwearCatalogue selectedUrl={footwearFile ? "" : selectedImage} disabled={busy}

                onSelect={(item, url) => { select(url, item); setShowCatalogue(false); }} />

            </div>

          )}

          <p className="my-4 text-center text-xs font-bold text-[#80695d]">or upload your own footwear</p>

          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#edc9ad] bg-[#fff9f4] p-5 text-center hover:border-[#e8895b]">

            <Camera className="mb-2 text-[#d97745]" size={28} />

            <span className="font-bold text-[#2a211c]">{footwearFile ? "Change your footwear photo" : "Tap to upload footwear"}</span>

            <span className="mt-1 text-xs text-[#80695d]">JPG, PNG or WebP · up to 8 MB</span>

            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e, "footwear")} disabled={busy} className="sr-only" />

          </label>

          {footwearPreview && <div className="relative mt-4 max-w-sm"><img src={footwearPreview} alt="Uploaded footwear" className="max-h-80 w-full rounded-2xl bg-[#fff9f4] object-contain" /><button type="button" onClick={() => { setFootwearFile(null); setSelectedImage(images[0] || ""); setResult(""); }} className="absolute right-2 top-2 rounded-full bg-white p-2 shadow" aria-label="Remove footwear"><X size={18} /></button></div>}



          <p className="mb-3 mt-7 text-sm font-bold text-[#2a211c]">2. Upload a clear photo of your feet</p>

          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#edc9ad] bg-[#fff9f4] p-5 text-center hover:border-[#e8895b]">

            <Camera className="mb-2 text-[#d97745]" size={28} />

            <span className="font-bold text-[#2a211c]">{feetFile ? "Change your feet photo" : "Tap to upload or take a photo"}</span>

            <span className="mt-1 text-xs text-[#80695d]">JPG, PNG or WebP · up to 8 MB · show your feet clearly</span>

            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e, "feet")} disabled={busy} className="sr-only" />

          </label>

          {feetPreview && <div className="relative mt-4 max-w-sm"><div className="relative w-full overflow-hidden rounded-2xl bg-[#fff9f4]">
                <img src={feetPreview} onLoad={(e) => initializeMask(e.currentTarget)} alt="Paint over both feet where the slippers should appear" className="block h-auto w-full select-none" draggable={false} />
                <canvas ref={overlayCanvas} className="absolute inset-0 h-full w-full cursor-crosshair touch-none" style={{ touchAction: "none" }}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); painting.current = true; lastPoint.current = null; paint(e); }}
                  onPointerMove={paint}
                  onPointerUp={() => { painting.current = false; lastPoint.current = null; }}
                  onPointerCancel={() => { painting.current = false; lastPoint.current = null; }} />
                <canvas ref={maskCanvas} className="hidden" />
              </div><button type="button" onClick={() => { setFeetFile(null); setResult(""); }} className="absolute right-2 top-2 rounded-full bg-white p-2 shadow" aria-label="Remove photo"><X size={18} /></button></div>}

            {feetPreview && <div className="mt-3 rounded-2xl border border-[#f4d9c4] bg-[#fff9f4] p-4">
              <p className="text-sm font-bold text-[#2a211c]">3. Paint the footwear area on BOTH feet</p>
              <p className="mt-1 text-xs leading-5 text-[#80695d]">Use your finger or mouse to cover the toes and the part of each foot where the slippers should sit. Orange means AI may change that area. Everything outside stays protected. Avoid painting trousers, grass or ankles.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3"><label className="text-xs font-bold text-black">Brush size <input className="text-black bg-black" aria-label="Brush size" type="range" min="15" max="140" value={brush} onChange={(e) => setBrush(Number(e.target.value))} /></label><button type="button" onClick={clearMask} className="rounded-full border border-[#e8895b] px-4 py-2 text-xs font-bold text-black">Clear painting</button></div>
            </div>}
          {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

          <button type="button" disabled={!feetFile || !painted || (!selectedImage && !footwearFile) || busy} onClick={generate} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2a211c] px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">

            {busy ? <><LoaderCircle size={18} className="animate-spin text-black" /> Creating your try-on…</> : <><Sparkles size={18} /> 4. Generate my try-on</>}

          </button>

          <p className="mt-3 text-xs leading-5 text-[#80695d]">Your photo is sent to our AI image provider to create the preview. Avoid uploading photos you do not have permission to use. Results are illustrative and do not confirm shoe size or fit.</p>

          {result && <div className="mt-8 rounded-3xl bg-[#fff9f4] p-4 sm:p-6"><h3 className="mb-4 text-xl font-black text-[#2a211c]">Your Every Step look ✨</h3><img src={result} alt="AI preview of footwear on your feet" className="mx-auto max-h-[650px] w-full rounded-2xl object-contain" /><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={download} className="flex items-center gap-2 rounded-full bg-[#e8895b] px-5 py-3 text-sm font-black text-white"><Download size={17} /> Save preview</button><button type="button" onClick={generate} disabled={busy} className="flex items-center gap-2 rounded-full border border-[#e8895b] px-5 py-3 text-sm font-black text-[#2a211c]"><RefreshCcw size={17} /> Try again</button></div><p className="mt-3 text-xs text-[#80695d]">The generated image may differ from the physical product. Check actual product photos and size information before ordering.</p></div>}

        </div>

      )}

    </section>

  );

}