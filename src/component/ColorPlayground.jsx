"use client";

import {
  Check,
  Download,
  ImagePlus,
  Pipette,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

const DEFAULT_COLOR = "#F4A261";

const BRAND_COLORS = [
  "#F4A261",
  "#E8895B",
  "#C9683F",
  "#F7C4A5",
  "#FFD6B8",
  "#FFF3E8",
  "#D98B5F",
  "#A95736",
  "#8B4A32",
  "#2A211C",
];

export default function ColorPlayground() {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);

  const [selectedColor, setSelectedColor] =
    useState(DEFAULT_COLOR);

  const [hexInput, setHexInput] =
    useState(DEFAULT_COLOR.replace("#", ""));

  const [sampledColor, setSampledColor] =
    useState(null);

  const [recentColors, setRecentColors] =
    useState([]);

  const [selectionTolerance, setSelectionTolerance] =
    useState(80);

  const [isDragging, setIsDragging] =
    useState(false);

  /*
  ============================================================
  LOAD IMAGE
  ============================================================
  */

  useEffect(() => {
    if (!image) return;

    const canvas = canvasRef.current;
    const originalCanvas =
      originalCanvasRef.current;

    if (!canvas || !originalCanvas) return;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    const originalCtx =
      originalCanvas.getContext("2d", {
        willReadFrequently: true,
      });

    const img = new Image();

    img.onload = () => {
      imageRef.current = img;

      const maxWidth = 900;
      const maxHeight = 650;

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        const ratio = maxWidth / width;

        width *= ratio;
        height *= ratio;
      }

      if (height > maxHeight) {
        const ratio = maxHeight / height;

        width *= ratio;
        height *= ratio;
      }

      width = Math.round(width);
      height = Math.round(height);

      canvas.width = width;
      canvas.height = height;

      originalCanvas.width = width;
      originalCanvas.height = height;

      /*
       * Draw the ORIGINAL image onto both canvases.
       */

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      originalCtx.clearRect(
        0,
        0,
        width,
        height
      );

      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
      );

      originalCtx.drawImage(
        img,
        0,
        0,
        width,
        height
      );
    };

    img.src = image;
  }, [image]);

  /*
  ============================================================
  UPLOAD
  ============================================================
  */

  function processFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      setImage(event.target.result);
      setSampledColor(null);
    };

    reader.readAsDataURL(file);
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];

    processFile(file);
  }

  /*
  ============================================================
  DRAG & DROP
  ============================================================
  */

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    processFile(file);
  }

  /*
  ============================================================
  CLICK ON FOOTWEAR
  ============================================================
  */

  function handleCanvasClick(event) {
    const canvas = canvasRef.current;

    const originalCanvas =
      originalCanvasRef.current;

    if (!canvas || !originalCanvas) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      canvas.width / rect.width;

    const scaleY =
      canvas.height / rect.height;

    const x = Math.floor(
      (event.clientX - rect.left) *
        scaleX
    );

    const y = Math.floor(
      (event.clientY - rect.top) *
        scaleY
    );

    /*
     * IMPORTANT:
     * Read the colour from the ORIGINAL image,
     * not the already-recoloured image.
     */

    const originalCtx =
      originalCanvas.getContext("2d", {
        willReadFrequently: true,
      });

    const pixel =
      originalCtx.getImageData(
        x,
        y,
        1,
        1
      ).data;

    const sourceColor = {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
    };

    setSampledColor(sourceColor);

    /*
     * Immediately recolour using the
     * selected colour.
     */

    applyColor(
      sourceColor,
      hexToRgb(selectedColor)
    );
  }

  /*
  ============================================================
  APPLY COLOUR
  ============================================================
  */

  function applyColor(
    sourceColor,
    targetColor
  ) {
    const canvas = canvasRef.current;

    const originalCanvas =
      originalCanvasRef.current;

    if (!canvas || !originalCanvas) {
      return;
    }

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    const originalCtx =
      originalCanvas.getContext("2d", {
        willReadFrequently: true,
      });

    /*
     * ALWAYS start from the original image.
     */

    const originalImageData =
      originalCtx.getImageData(
        0,
        0,
        originalCanvas.width,
        originalCanvas.height
      );

    const newImageData =
      new ImageData(
        new Uint8ClampedArray(
          originalImageData.data
        ),
        originalImageData.width,
        originalImageData.height
      );

    const pixels =
      newImageData.data;

    for (
      let i = 0;
      i < pixels.length;
      i += 4
    ) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      /*
       * Calculate colour distance.
       */

      const distance = Math.sqrt(
        Math.pow(
          r - sourceColor.r,
          2
        ) +
          Math.pow(
            g - sourceColor.g,
            2
          ) +
          Math.pow(
            b - sourceColor.b,
            2
          )
      );

      if (
        distance <
        selectionTolerance
      ) {
        /*
         * How strongly should this pixel
         * be recoloured?
         */

        const strength =
          Math.max(
            0,
            Math.min(
              1,
              1 -
                distance /
                  selectionTolerance
            )
          );

        /*
         * Preserve brightness/shading.
         */

        const brightness =
          (r + g + b) / 3 / 255;

        const adjustedTarget = {
          r: targetColor.r * (
            0.65 +
            brightness * 0.35
          ),

          g: targetColor.g * (
            0.65 +
            brightness * 0.35
          ),

          b: targetColor.b * (
            0.65 +
            brightness * 0.35
          ),
        };

        pixels[i] =
          r * (1 - strength) +
          adjustedTarget.r *
            strength;

        pixels[i + 1] =
          g * (1 - strength) +
          adjustedTarget.g *
            strength;

        pixels[i + 2] =
          b * (1 - strength) +
          adjustedTarget.b *
            strength;
      }
    }

    ctx.putImageData(
      newImageData,
      0,
      0
    );
  }

  /*
  ============================================================
  CHANGE COLOUR
  ============================================================
  */

  function chooseColor(color) {
    const normalized =
      color.toUpperCase();

    setSelectedColor(normalized);

    setHexInput(
      normalized.replace("#", "")
    );

    addRecentColor(normalized);

    /*
     * If the customer has already clicked
     * the footwear, immediately recolour it.
     */

    if (sampledColor) {
      applyColor(
        sampledColor,
        hexToRgb(normalized)
      );
    }
  }

  /*
  ============================================================
  COLOUR PICKER
  ============================================================
  */

  function handleColorPicker(event) {
    chooseColor(
      event.target.value
    );
  }

  /*
  ============================================================
  HEX INPUT
  ============================================================
  */

  function handleHexChange(event) {
    let value =
      event.target.value
        .replace("#", "")
        .replace(/[^0-9a-fA-F]/g, "")
        .slice(0, 6);

    setHexInput(value);

    if (value.length === 6) {
      chooseColor(`#${value}`);
    }
  }

  /*
  ============================================================
  RECENT COLOURS
  ============================================================
  */

  function addRecentColor(color) {
    setRecentColors(
      (previous) => {
        const filtered =
          previous.filter(
            (item) =>
              item.toUpperCase() !==
              color.toUpperCase()
          );

        return [
          color,
          ...filtered,
        ].slice(0, 8);
      }
    );
  }

  /*
  ============================================================
  RESET
  ============================================================
  */

  function resetImage() {
    const canvas = canvasRef.current;

    const originalCanvas =
      originalCanvasRef.current;

    if (
      !canvas ||
      !originalCanvas
    ) {
      return;
    }

    const ctx =
      canvas.getContext("2d");

    const originalCtx =
      originalCanvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      originalCanvas,
      0,
      0
    );

    /*
     * Re-read the original clicked
     * colour if necessary.
     */

    setSampledColor(null);

    /*
     * Keep the original image untouched.
     */

    originalCtx.save();
    originalCtx.restore();
  }

  /*
  ============================================================
  DOWNLOAD
  ============================================================
  */

  function downloadImage() {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const link =
      document.createElement("a");

    link.download =
      "every-step-design.jpg";

    link.href =
      canvas.toDataURL(
        "image/jpeg",
        0.95
      );

    link.click();
  }

  /*
  ============================================================
  HEX → RGB
  ============================================================
  */

  function hexToRgb(hex) {
    const clean =
      hex.replace("#", "");

    return {
      r: parseInt(
        clean.substring(0, 2),
        16
      ),

      g: parseInt(
        clean.substring(2, 4),
        16
      ),

      b: parseInt(
        clean.substring(4, 6),
        16
      ),
    };
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">

      {/* =====================================================
          IMAGE
      ====================================================== */}

      <div
        className={`relative overflow-hidden rounded-[2.5rem] bg-[#FFF3E8] p-4 transition sm:p-6 ${
          isDragging
            ? "ring-4 ring-[#F4A261]"
            : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >

        {!image ? (

          <button
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="group flex min-h-[480px] w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[#E8895B]/30 bg-white transition duration-300 hover:border-[#F4A261] hover:bg-[#FFF9F4]"
          >

            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF3E8] transition duration-300 group-hover:scale-110 group-hover:rotate-6">

              <ImagePlus
                size={32}
                className="text-[#C9683F]"
              />

            </div>

            <h3 className="text-xl font-black text-[#2A211C]">
              Drop your slipper here
            </h3>

            <p className="mt-2 max-w-xs text-center text-sm leading-6 text-black/40">
              Drag and drop your image
              here, or tap to upload
              a photo.
            </p>

            <span className="mt-6 rounded-full bg-[#F4A261] px-6 py-3 text-sm font-black text-[#2A211C] transition hover:-translate-y-0.5 hover:bg-[#E8895B]">
              Upload image
            </span>

            <span className="mt-3 text-xs text-black/30">
              JPG, PNG or WebP
            </span>

          </button>

        ) : (

          <div className="relative flex min-h-[480px] items-center justify-center rounded-[2rem] bg-[#F3EEE7] p-4">

            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="max-h-[620px] max-w-full rounded-xl object-contain shadow-2xl"
            />

            {/* Hidden ORIGINAL canvas */}

            <canvas
              ref={originalCanvasRef}
              className="hidden"
            />

            <div className="absolute left-7 top-7 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-[#2A211C] shadow-lg backdrop-blur">

              <Pipette
                size={13}
                className="text-[#C9683F]"
              />

              Click the area you want
              to recolour

            </div>

          </div>

        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleUpload}
          className="hidden"
        />

      </div>


      {/* =====================================================
          CONTROLS
      ====================================================== */}

      <div className="rounded-[2.5rem] bg-[#2A211C] p-6 text-white sm:p-8">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#F4A261]">
              Every Step
            </p>

            <h3 className="mt-2 text-2xl font-black">
              Make it yours.
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Pick literally any colour
              you can imagine.
            </p>

          </div>

          <Sparkles
            size={22}
            className="text-[#F4A261]"
          />

        </div>


        {/* COLOUR PICKER */}

        <div className="mt-8">

          <p className="mb-4 text-sm font-bold">
            Choose your colour
          </p>

          <div className="rounded-[1.5rem] bg-white/5 p-4">

            <div className="flex items-center gap-4">

              <label
                className="relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border-4 border-white/10 transition hover:scale-105"
                style={{
                  backgroundColor:
                    selectedColor,
                }}
              >

                <input
                  type="color"
                  value={selectedColor}
                  onChange={
                    handleColorPicker
                  }
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                  <Pipette
                    size={22}
                    className="text-white drop-shadow-lg"
                  />

                </div>

              </label>

              <div>

                <p className="text-xs text-white/30">
                  Current colour
                </p>

                <p className="mt-1 text-lg font-black uppercase">
                  {selectedColor}
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Tap the square to open
                  the full colour spectrum.
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* HEX */}

        <div className="mt-6">

          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/30">
            HEX colour
          </label>

          <div className="flex overflow-hidden rounded-full border border-white/10 bg-white/5 focus-within:border-[#F4A261]">

            <span className="flex items-center pl-5 text-white/30">
              #
            </span>

            <input
              type="text"
              value={hexInput}
              onChange={handleHexChange}
              placeholder="F4A261"
              maxLength={6}
              className="w-full bg-transparent px-2 py-3.5 text-sm font-bold uppercase outline-none placeholder:text-white/20"
            />

            {hexInput.length ===
              6 && (

              <div className="flex items-center pr-4">

                <Check
                  size={16}
                  className="text-[#F4A261]"
                />

              </div>

            )}

          </div>

        </div>


        {/* BRAND COLOURS */}

        <div className="mt-7">

          <div className="mb-3 flex items-center justify-between">

            <p className="text-sm font-bold">
              Every Step favourites
            </p>

            <span className="text-xs text-white/25">
              Try one
            </span>

          </div>

          <div className="flex flex-wrap gap-2">

            {BRAND_COLORS.map(
              (color) => {

                const active =
                  selectedColor.toUpperCase() ===
                  color.toUpperCase();

                return (
                  <button
                    key={color}
                    onClick={() =>
                      chooseColor(color)
                    }
                    title={color}
                    className={`relative h-9 w-9 rounded-full border-2 transition duration-200 hover:scale-110 ${
                      active
                        ? "border-white"
                        : "border-transparent"
                    }`}
                    style={{
                      backgroundColor:
                        color,
                    }}
                  >

                    {active && (

                      <Check
                        size={13}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md"
                      />

                    )}

                  </button>
                );
              }
            )}

          </div>

        </div>


        {/* RECENT */}

        {recentColors.length > 0 && (

          <div className="mt-7">

            <div className="mb-3 flex items-center justify-between">

              <p className="text-sm font-bold">
                Recent colours
              </p>

              <span className="text-xs text-white/25">
                {recentColors.length}/8
              </span>

            </div>

            <div className="flex flex-wrap gap-2">

              {recentColors.map(
                (color, index) => {

                  const active =
                    selectedColor.toUpperCase() ===
                    color.toUpperCase();

                  return (
                    <button
                      key={`${color}-${index}`}
                      onClick={() =>
                        chooseColor(color)
                      }
                      title={color}
                      className={`relative h-9 w-9 rounded-full border-2 transition hover:scale-110 ${
                        active
                          ? "border-white"
                          : "border-white/10"
                      }`}
                      style={{
                        backgroundColor:
                          color,
                      }}
                    >

                      {active && (

                        <Check
                          size={13}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-md"
                        />

                      )}

                    </button>
                  );
                }
              )}

            </div>

          </div>

        )}


        {/* SENSITIVITY */}

        <div className="mt-8">

          <div className="mb-3 flex justify-between">

            <p className="text-sm font-bold">
              Colour sensitivity
            </p>

            <span className="text-xs text-white/30">
              {selectionTolerance}
            </span>

          </div>

          <input
            type="range"
            min="20"
            max="180"
            value={selectionTolerance}
            onChange={(event) =>
              setSelectionTolerance(
                Number(event.target.value)
              )
            }
            className="w-full accent-[#F4A261]"
          />

          <div className="mt-2 flex justify-between text-[10px] text-white/25">
            <span>Precise</span>
            <span>Broad</span>
          </div>

        </div>


        {/* BUTTONS */}

        <div className="mt-8 grid grid-cols-2 gap-3">

          <button
            onClick={resetImage}
            disabled={!image}
            className="flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
          >

            <RotateCcw size={15} />

            Reset

          </button>

          <button
            onClick={downloadImage}
            disabled={!image}
            className="flex items-center justify-center gap-2 rounded-full bg-[#F4A261] px-4 py-3 text-sm font-black text-[#2A211C] transition hover:-translate-y-0.5 hover:bg-[#E8895B] disabled:cursor-not-allowed disabled:opacity-30"
          >

            <Download size={15} />

            Save design

          </button>

        </div>


        {/* TIP */}

        <div className="mt-6 rounded-2xl bg-[#F4A261]/10 p-4">

          <p className="text-xs leading-5 text-white/40">

            <span className="font-bold text-[#F4A261]">
              How it works:
            </span>{" "}

            First click the actual
            footwear area you want to
            change. Then choose any
            colour. You can keep changing
            colours without losing your
            original image.

          </p>

        </div>

      </div>

    </div>
  );
}