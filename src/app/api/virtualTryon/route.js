import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { withAiPass } from "@/lib/with-ai-pass";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function fail(message, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}
function valid(file) {
  return file instanceof File && TYPES.has(file.type) && file.size > 0 && file.size <= MAX_BYTES;
}
function safeUrl(value) {
  try {
    const image = new URL(value);
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    return image.protocol === "https:" && image.origin === base.origin &&
      image.pathname.startsWith("/storage/v1/object/public/product-images/");
  } catch { return false; }
}
async function aiFile(file, name) {
  return toFile(Buffer.from(await file.arrayBuffer()), name, { type: file.type });
}
async function productFile(url) {
  if (!safeUrl(url)) throw Object.assign(new Error("Select a valid Every Step product photo."), { status: 400 });
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Object.assign(new Error("Cannot download this product image."), { status: 400 });
  const type = (response.headers.get("content-type") || "").split(";")[0].trim();
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!TYPES.has(type) || !bytes.length || bytes.length > MAX_BYTES) {
    throw Object.assign(new Error("Product photo must be JPG, PNG or WebP under 8 MB."), { status: 400 });
  }
  return toFile(bytes, "exact-footwear-reference", { type });
}

async function generate(request) {
  try {
    if (!process.env.OPENAI_API_KEY) return fail("OPENAI_API_KEY is missing on the server.");
    const form = await request.formData();
    const feet = form.get("feetPhoto");
    const mask = form.get("maskPhoto");
    const uploaded = form.get("footwearPhoto");
    const url = form.get("productImage");
    const name = String(form.get("productName") || "footwear").slice(0, 120);

    if (!valid(feet)) return fail("Upload a JPG, PNG or WebP feet photo under 8 MB.", 400);
    if (!(mask instanceof File) || mask.type !== "image/png" || mask.size === 0 || mask.size > MAX_BYTES) {
      return fail("Paint the footwear areas on both feet before generating.", 400);
    }
    let footwear;
    if (uploaded instanceof File) {
      if (!valid(uploaded)) return fail("Footwear photo must be JPG, PNG or WebP under 8 MB.", 400);
      footwear = await aiFile(uploaded, "exact-footwear-reference");
    } else if (typeof url === "string" && url) {
      footwear = await productFile(url);
    } else {
      return fail("Select a catalogue product or upload footwear.", 400);
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 240000, maxRetries: 1 });
    const prompt = `
Precise masked photo edit for a footwear e-commerce virtual try-on.
IMAGE 1 is the customer's original photograph and must be the BASE IMAGE.
IMAGE 2 is the actual physical product "${name}" and is the ONLY footwear design reference.
The transparent parts of the MASK identify the only places to edit.

Within the transparent mask areas, make the person realistically wear the EXACT footwear shown in IMAGE 2. Fit a left and right counterpart to the feet without changing the product's construction.
CRITICAL PRODUCT FIDELITY: reproduce the exact number, width, angle, overlap, cuts and geometry of straps; their stitching and seams; the original leather grain and color; the exact sole outline, edge and footbed. No simplification, redesign, new straps, decorative patterns or substitute sandals. The second sandal must match the first as a mirrored pair, not an invented style.
Keep visible skin between straps and keep believable occlusion and contact shadows.
DO NOT change any pixels outside the masked regions: preserve the original grass, clothing, skin tone, legs, pose, and camera perspective. Do not beautify or redraw the entire photograph. One realistic finished photo, no labels or collage.
If the reference angle doesn't reveal an element, prefer a conservative consistent reconstruction instead of inventing details.
`;
    const response = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      image: [await aiFile(feet, "customer-feet"), footwear],
      mask: await aiFile(mask, "editable-footwear-area.png"),
      prompt,
      quality: "high",
      size: "auto",
      output_format: "png",
    });
    const base64 = response.data?.[0]?.b64_json;
    const remoteUrl = response.data?.[0]?.url;
    const imageUrl = base64 ? `data:image/png;base64,${base64}` : remoteUrl;
    if (!imageUrl) return fail("OpenAI did not return a generated image.", 502);
    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("VIRTUAL TRY-ON:", { status: error?.status, code: error?.code, message: error?.message });
    if (error?.status === 429) return fail("OpenAI quota or rate limit reached. Check billing.", 429);
    if (error?.status === 401) return fail("OpenAI API key was rejected.", 401);
    if (error?.status === 400) return fail(error.message || "Invalid OpenAI image request.", 400);
    return fail(error?.message || "Try-on generation failed.", 500);
  }
}

export const POST = withAiPass(generate);