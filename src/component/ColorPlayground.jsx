"use client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Download,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Undo2,
  Redo2,
} from "lucide-react";

import { useRef, useState } from "react";

const BRAND_COLORS = [
  "#F4A261",
  "#E8895B",
  "#D98B5F",
  "#C9683F",
  "#A95736",
  "#F7C4A5",
  "#FFD6B8",
  "#FFF3E8",
];

export default function ColorPlayground({
  product = null,
  onAddToCart,
}) {
  const inputRef = useRef(null);

  const [hexs, setHexs] =
  useState("F4A261");

  const [colorDescription, setColorDescription] =
  useState("");
  const [originalImage, setOriginalImage] =
    useState(null);

  const [previewImage, setPreviewImage] =
    useState(null);

  /*
   * History of AI-generated versions.
   */
  const [history, setHistory] = useState([]);

  const [historyIndex, setHistoryIndex] =
    useState(-1);

  const [selectedColor, setSelectedColor] =
    useState("#F4A261");

  const [hex, setHex] =
    useState("F4A261");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [recentColors, setRecentColors] =
    useState([]);

  /*
   * Before / After toggle.
   */
  const [showOriginal, setShowOriginal] =
    useState(false);

  /*
   ============================================================
   UPLOAD
   ============================================================
  */

  function handleUpload(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please upload an image."
      );

      return;
    }

    setError("");

    const reader =
      new FileReader();

    reader.onload = () => {
      const image =
        reader.result;

      setOriginalImage(image);

      /*
       * Start the session with the
       * original image.
       */
      setPreviewImage(image);

      setHistory([]);

      setHistoryIndex(-1);

      setShowOriginal(false);

      setSelectedColor("#F4A261");

      setHex("F4A261");
    };

    reader.readAsDataURL(file);
  }

  /*
   ============================================================
   AI COLOUR CHANGE
   ============================================================
  */

 async function changeColor(color) {
  if (!originalImage) {
    setError(
      "Upload a footwear image first."
    );

    return;
  }

  if (!color || !color.trim()) {
    setError(
      "Please choose or describe a colour first."
    );

    return;
  }

  const finalColor = color.trim();

  setSelectedColor(finalColor);

  // Only update HEX if the selected value is actually a HEX colour.
  if (/^#[0-9A-Fa-f]{6}$/.test(finalColor)) {
    setHex(finalColor.replace("#", ""));
  }

  setError("");

  setLoading(true);

  setShowOriginal(false);

  try {
    const response =
      await fetch(originalImage);

    const blob =
      await response.blob();

    const file =
      new File(
        [blob],
        "footwear.png",
        {
          type: blob.type,
        }
      );

    const formData =
      new FormData();

    formData.append(
      "image",
      file
    );

    formData.append(
      "color",
      finalColor
    );

    const aiResponse =
      await fetch(
        "/api/footwearChange",
        {
          method: "POST",
          body: formData,
        }
      );

    const responseText =
      await aiResponse.text();

    let data;

    try {
      data =
        JSON.parse(
          responseText
        );
    } catch {
      throw new Error(
        "The server returned an unexpected response. Check your terminal."
      );
    }

    if (!aiResponse.ok) {
      throw new Error(
        data.error ||
          "Unable to change colour."
      );
    }

    const newImage =
      data.imageUrl;

    setPreviewImage(
      newImage
    );

    const newHistory =
      history.slice(
        0,
        historyIndex + 1
      );

    newHistory.push({
      image: newImage,
      color: finalColor,
    });

    setHistory(
      newHistory
    );

    setHistoryIndex(
      newHistory.length - 1
    );

    setRecentColors(
      (previous) => [
        finalColor,
        ...previous.filter(
          (item) =>
            item !== finalColor
        ),
      ].slice(0, 8)
    );

  } catch (error) {

    console.error(error);

    setError(
      error.message ||
        "Something went wrong."
    );

  } finally {

    setLoading(false);

  }
}

  /*
   ============================================================
   HEX INPUT
   ============================================================
  */

function handleHexChange(event) {
  const value =
    event.target.value
      .replace("#", "")
      .replace(
        /[^0-9a-fA-F]/g,
        ""
      )
      .slice(0, 6)
      .toUpperCase();

  setHex(value);

  if (value.length === 6) {
    setSelectedColor(`#${value}`);
  }
}

  /*
   ============================================================
   UNDO
   ============================================================
  */

  function undo() {
    if (
      historyIndex <= 0
    ) {
      /*
       * If we're on the first generated
       * image, go back to original.
       */
      setPreviewImage(
        originalImage
      );

      setHistoryIndex(-1);

      return;
    }

    const previousIndex =
      historyIndex - 1;

    const previous =
      history[
        previousIndex
      ];

    setPreviewImage(
      previous.image
    );

    setSelectedColor(
      previous.color
    );

    setHex(
      previous.color.replace(
        "#",
        ""
      )
    );

    setHistoryIndex(
      previousIndex
    );
  }

  /*
   ============================================================
   REDO
   ============================================================
  */

  function redo() {
    if (
      historyIndex >=
      history.length - 1
    ) {
      return;
    }

    const nextIndex =
      historyIndex + 1;

    const next =
      history[nextIndex];

    setPreviewImage(
      next.image
    );

    setSelectedColor(
      next.color
    );

    setHex(
      next.color.replace(
        "#",
        ""
      )
    );

    setHistoryIndex(
      nextIndex
    );

    setShowOriginal(false);
  }

  /*
   ============================================================
   GO TO ORIGINAL
   ============================================================
  */

  function showOriginalVersion() {
    if (!originalImage) return;

    setPreviewImage(
      originalImage
    );

    setShowOriginal(false);

    setHistoryIndex(-1);
  }

  /*
   ============================================================
   BEFORE / AFTER
   ============================================================
  */

  function toggleBeforeAfter() {
    if (!originalImage) return;

    setShowOriginal(
      (previous) =>
        !previous
    );
  }

  /*
   ============================================================
   RESET
   ============================================================
  */

  function reset() {
    setPreviewImage(
      originalImage
    );

    setHistory([]);

    setHistoryIndex(-1);

    setSelectedColor(
      "#F4A261"
    );

    setHex(
      "F4A261"
    );

    setShowOriginal(false);

    setError("");
  }

  /*
   ============================================================
   CHOOSE ANOTHER FOOTWEAR
   ============================================================
  */

  function chooseAnother() {
    /*
     * Open the file picker again.
     */

    inputRef.current?.click();
  }

  /*
   ============================================================
   DOWNLOAD
   ============================================================
  */

async function downloadImage() {
  if (!previewImage) return;

  try {
    setError("");

    const response =
      await fetch(previewImage);

    if (!response.ok) {
      throw new Error(
        "Unable to download the design."
      );
    }

    const blob =
      await response.blob();

    const blobUrl =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = blobUrl;

    link.download =
      "every-step-custom-design.png";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(
      blobUrl
    );

  } catch (error) {

    console.error(
      "Download error:",
      error
    );

    setError(
      "Unable to download the design. Please try again."
    );

  }
}

function sendToWhatsApp() {
  if (!previewImage) return;

  const message = `
Hi Every Step! 👋

I just created a custom footwear design using your AI designer.

I'd like to order this design.

Colour: ${selectedColor}

I have attached my finished design below.

Thank you! ❤️
  `.trim();

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(
    whatsappUrl,
    "_blank"
  );
}

  /*
   ============================================================
   ADD TO CART
   ============================================================
  */

  function addToCart() {
    if (
      !product ||
      !previewImage
    ) {
      return;
    }

    const item = {
      ...product,

      customization: {
        color: selectedColor,
        previewImage,
      },
    };

    if (onAddToCart) {
      onAddToCart(item);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">

      {/* =====================================================
          LEFT — IMAGE
      ====================================================== */}

      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#FFF3E8] p-5">

        {!previewImage ? (

          /*
           * EMPTY STATE
           */

          <button
            onClick={() =>
              inputRef.current?.click()
            }
            className="flex min-h-[520px] w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[#E8895B]/30 bg-white transition hover:border-[#F4A261] hover:bg-[#FFFCF9]"
          >

            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF3E8]">

              <ImagePlus
                size={32}
                className="text-[#C9683F]"
              />

            </div>

            <h2 className="text-2xl font-black text-[#2A211C]">
              Upload your footwear
            </h2>

            <p className="mt-2 max-w-sm text-center text-sm leading-6 text-black/40">
              Upload a photo of your
              footwear design and make it yours.
            </p>

            <span className="mt-6 rounded-full bg-[#F4A261] px-7 py-3 font-black text-[#2A211C]">
              Choose footwear
            </span>

          </button>

        ) : (

          /*
           * IMAGE PREVIEW
           */

          <div className="relative flex min-h-[520px] items-center justify-center rounded-[2rem] bg-[#F3EEE7] p-5">

            <img
              src={
                showOriginal
                  ? originalImage
                  : previewImage
              }
              alt="Every Step footwear preview"
              className="max-h-[650px] max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {/* AI LOADING */}

            {loading && (

              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] bg-[#2A211C]/80 backdrop-blur-md">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F4A261]">

                  <Loader2
                    size={28}
                    className="animate-spin text-[#2A211C]"
                  />

                </div>

                <h3 className="mt-5 text-xl font-black text-white">
                 Step AI is working its magic...
                </h3>

                <p className="mt-2 text-sm text-white/40">
                  Are your shoe lace tied? I think you should check...
                </p>

              </div>

            )}

            {/* IMAGE LABEL */}

            {!loading && (

              <div className="absolute left-7 top-7 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-[#2A211C] shadow-lg">

                <Sparkles
                  size={14}
                  className="text-[#F4A261]"
                />

                {showOriginal
                  ? "Original"
                  : "Your design"}

              </div>

            )}

            {/* BEFORE / AFTER */}

            {!loading && (

              <button
                onClick={
                  toggleBeforeAfter
                }
                className="absolute bottom-7 right-7 flex items-center gap-2 rounded-full bg-[#2A211C]/90 px-4 py-2.5 text-xs font-black text-white shadow-xl backdrop-blur transition hover:bg-[#2A211C]"
              >

                <ChevronLeft
                  size={14}
                />

                {showOriginal
                  ? "Show design"
                  : "Compare original"}

              </button>

            )}

          </div>

        )}

        {/* ERROR */}

        {error && (

          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>

        )}

        {/* FILE INPUT */}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleUpload}
          className="hidden"
        />

      </div>


      {/* =====================================================
          RIGHT — CONTROLS
      ====================================================== */}

      <div className="rounded-[2.5rem] bg-[#2A211C] p-6 text-white sm:p-8">

        {/* HEADER */}

        <div className="flex items-start justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#F4A261]">
              Every Step AI
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Take a <span className="text-[#F4A261]">Step</span>.
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/40">
              Play around. Change it.
              Compare it. Find your
              perfect colour.
            </p>

          </div>

          <Sparkles
            size={22}
            className="text-[#F4A261]"
          />

        </div>


        {/* =================================================
            NAVIGATION
        ================================================== */}

        {originalImage && (

          <div className="mt-7">

            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/30">
              Your footwear
            </p>

            <div className="grid grid-cols-2 gap-2">

              {/* ANOTHER FOOTWEAR */}

              <button
                onClick={
                  chooseAnother
                }
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold transition hover:bg-white/10 disabled:opacity-40"
              >

                <ImagePlus
                  size={15}
                />

                Pick another

              </button>


              {/* ORIGINAL */}

              <button
                onClick={
                  showOriginalVersion
                }
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold transition hover:bg-white/10 disabled:opacity-40"
              >

                <RotateCcw
                  size={15}
                />

                Original

              </button>

            </div>


            {/* UNDO / REDO */}

            <div className="mt-2 grid grid-cols-2 gap-2">

              <button
                onClick={undo}
                disabled={
                  loading ||
                  !originalImage ||
                  historyIndex < 0
                }
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25"
              >

                <Undo2
                  size={15}
                />

                Previous

              </button>

              <button
                onClick={redo}
                disabled={
                  loading ||
                  historyIndex >=
                    history.length - 1
                }
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-25"
              >

                Next

                <Redo2
                  size={15}
                />

              </button>

            </div>

          </div>

        )}


        {/* =================================================
            COLOUR PICKER
        ================================================== */}

{/* =================================================
    COLOUR PICKER
================================================== */}

<div className="mt-8">

  <p className="mb-4 text-sm font-bold">
    Choose your colour
  </p>

  {/* VISUAL COLOUR PICKER */}

  <label className="relative block h-24 w-full cursor-pointer overflow-hidden rounded-2xl">

    <div
      className="absolute inset-0 transition-colors"
      style={{
        backgroundColor:
          /^#[0-9A-Fa-f]{6}$/.test(
            selectedColor
          )
            ? selectedColor
            : "#F4A261",
      }}
    />

    <input
      type="color"
      value={
        /^#[0-9A-Fa-f]{6}$/.test(
          selectedColor
        )
          ? selectedColor
          : "#F4A261"
      }
      onChange={(event) => {

        const color =
          event.target.value.toUpperCase();

        setSelectedColor(
          color
        );

        setHex(
          color.replace("#", "")
        );

        setColorDescription("");

      }}
      disabled={
        !originalImage ||
        loading
      }
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
    />

    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

      <span className="rounded-full bg-black/20 px-5 py-2 text-sm font-black text-white backdrop-blur">
        Pick any colour
      </span>

    </div>

  </label>


  {/* OR */}

  <div className="my-5 flex items-center gap-3">

    <div className="h-px flex-1 bg-white/10" />

    <span className="text-xs font-bold uppercase tracking-wider text-white/30">
      or
    </span>

    <div className="h-px flex-1 bg-white/10" />

  </div>


  {/* NATURAL LANGUAGE COLOUR */}

  <div>

    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/30">
      Describe your colour
    </label>

    <input
      type="text"
      value={colorDescription}
      onChange={(event) => {
        setColorDescription(
          event.target.value
        );
      }}
      disabled={
        !originalImage ||
        loading
      }
      placeholder="e.g. blush pink, wine red, sage green..."
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold outline-none transition placeholder:text-white/20 focus:border-[#F4A261]/50 focus:bg-white/10 disabled:opacity-40"
    />

    <p className="mt-2 text-xs leading-5 text-white/30">
      You can describe the exact colour
      you have in mind. Try colors like
      "dusty rose", "burnt orange",
      "cream", or "deep burgundy", anything works.
    </p>

  </div>


  {/* CHANGE COLOUR */}

  <button
    onClick={() => {

      const colorToUse =
        colorDescription.trim()
          ? colorDescription.trim()
          : selectedColor;

      changeColor(
        colorToUse
      );

    }}
    disabled={
      !originalImage ||
      loading ||
      (
        !selectedColor &&
        !colorDescription.trim()
      )
    }
    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#F4A261] px-5 py-4 font-black text-[#2A211C] transition hover:bg-[#E8895B] disabled:cursor-not-allowed disabled:opacity-40"
  >

    {loading ? (
      <>
        <Loader2
          size={17}
          className="animate-spin"
        />

        Changing colour...
      </>
    ) : (
      <>
        <Sparkles size={17} />

        Change colour
      </>
    )}

  </button>

</div>        {/* =================================================
            HEX
        ================================================== */}

        <div className="mt-5">

          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/30">
            HEX colour
          </label>

          <div className="flex rounded-full border border-white/10 bg-white/5">

            <span className="flex items-center pl-5 text-white/30">
              #
            </span>

            <input
              value={hex}
              onChange={
                handleHexChange
              }
              maxLength={6}
              disabled={
                !originalImage ||
                loading
              }
              placeholder="F4A261"
              className="w-full bg-transparent px-2 py-3.5 text-sm font-black uppercase outline-none disabled:opacity-40"
            />

            {hex.length ===
              6 && (

              <Check
                size={16}
                className="mr-4 mt-4 text-[#F4A261]"
              />

            )}

          </div>

        </div>


        {/* =================================================
            BRAND COLOURS
        ================================================== */}

        <div className="mt-7">

          <p className="mb-3 text-sm font-bold">
            Every Step favourites
          </p>

          <div className="flex flex-wrap gap-2">

            {BRAND_COLORS.map(
              (color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setHex(color.replace("#", ""));
                  }}
                  disabled={
                    !originalImage ||
                    loading
                  }
                  className="h-10 w-10 rounded-full border-2 border-white/10 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: color,
                  }}
                  title={color}
                >
                  {selectedColor === color && (
                    <Check
                      size={14}
                      className="mx-auto text-white drop-shadow"
                    />
                  )}
                </button>

              )
            )}

          </div>

        </div>


        {/* =================================================
            RECENT COLOURS
        ================================================== */}

        {recentColors.length >
          0 && (

          <div className="mt-7">

            <p className="mb-3 text-sm font-bold">
              Recent colours
            </p>

            <div className="flex flex-wrap gap-2">

              {recentColors.map(
                (color) => (

                  <button
                    key={color}
                    onClick={() =>
                      changeColor(
                        color
                      )
                    }
                    disabled={loading}
                    className="h-9 w-9 rounded-full border border-white/20 transition hover:scale-110 disabled:opacity-30"
                    style={{
                      backgroundColor:
                        color,
                    }}
                    title={color}
                  />

                )
              )}

            </div>

          </div>

        )}


        {/* =================================================
            BOTTOM ACTIONS
        ================================================== */}

        {originalImage && (

          <div className="mt-8 border-t border-white/10 pt-6">

            <div className="grid grid-cols- gap-2">

              {/* START OVER */}

             <div className="grid grid-cols- gap-2">

              <button
                onClick={reset}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-xs font-bold transition hover:bg-white/5 disabled:opacity-30"
              >

                <RotateCcw
                  size={14}
                />

                Start over

              </button>


              <button
                onClick={downloadImage}
                disabled={
                  loading ||
                  !previewImage
                }
                className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black text-[#2A211C] transition hover:bg-[#FFF3E8] disabled:opacity-30"
              >

                <Download
                  size={14}
                />

                Download design

              </button>

          </div>


              {/* <button
                onClick={sendToWhatsApp}
                disabled={
                  loading ||
                  !previewImage
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-4 text-sm font-black text-[#25D366] transition hover:bg-[#25D366]/20 disabled:cursor-not-allowed disabled:opacity-30"
              >

                <span>
                  💬
                </span>

                Send my design to Every Step

              </button> */}
                  <Link
            href="https://wa.me/+2348163186020"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-4 text-sm font-black text-[#25D366] transition hover:bg-[#25D366]/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
             <span>
                  💬
                </span>
            Order on WhatsApp
          </Link>
              <p className="mt-3 text-center text-[11px] leading-5 text-white/30">
                Download your design first, then attach the
                downloaded image when WhatsApp opens.
              </p>


              {/* DOWNLOAD */}

              {/* <button
                onClick={
                  downloadImage
                }
                disabled={
                  loading ||
                  !previewImage
                }
                className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-xs font-black text-[#2A211C] transition hover:bg-[#FFF3E8] disabled:opacity-30"
              >

                <Download
                  size={14}
                />

                Save design

              </button> */}

            </div>


            {/* ADD TO CART */}

            {product && (

              <div className="mt-5">

                <div className="flex items-end justify-between">

                  <div>

                    <p className="text-xs text-white/30">
                      Your design
                    </p>

                    <h3 className="mt-1 font-black">
                      {product.name}
                    </h3>

                  </div>

                  <p className="text-xl font-black text-[#F4A261]">
                    ₦
                    {Number(
                      product.price
                    ).toLocaleString()}
                  </p>

                </div>

                <button
                  onClick={
                    addToCart
                  }
                  disabled={
                    loading ||
                    !previewImage
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#F4A261] px-5 py-4 font-black text-[#2A211C] transition hover:bg-[#E8895B] disabled:opacity-40"
                >

                  <ShoppingBag
                    size={17}
                  />

                  Add to cart

                </button>

              </div>

            )}

          </div>

        )}

      </div>

    </section>
  );
}