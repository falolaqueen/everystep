
import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { withAiPass } from "@/lib/with-ai-pass";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function isValidUpload(file) {
  return (
    file instanceof File &&
    ALLOWED_TYPES.has(file.type) &&
    file.size > 0 &&
    file.size <= MAX_FILE_SIZE
  );
}

function isPublicImageUrl(value) {
  try {
    const url = new URL(value);

    // Product images must come from your
    // own public Supabase storage bucket.
    const supabaseUrl = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );

    return (
      url.protocol === "https:" &&
      url.origin === supabaseUrl.origin &&
      url.pathname.startsWith(
        "/storage/v1/object/public/product-images/"
      )
    );
  } catch {
    return false;
  }
}

async function existingPOST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const feetPhoto = formData.get("feetPhoto");
    const productImageUrl = formData.get("productImage");
    const productName = String(
      formData.get("productName") || "footwear"
    ).slice(0, 120);

    if (!isValidUpload(feetPhoto)) {
      return NextResponse.json(
        {
          error:
            "Upload a JPG, PNG or WebP photo under 8MB.",
        },
        { status: 400 }
      );
    }

    if (
      typeof productImageUrl !== "string" ||
      !isPublicImageUrl(productImageUrl)
    ) {
      return NextResponse.json(
        { error: "Invalid footwear product image." },
        { status: 400 }
      );
    }

    // Download only images from the trusted
    // Supabase public storage location.
    const productResponse = await fetch(productImageUrl, {
      signal: AbortSignal.timeout(15000),
    });

    if (!productResponse.ok) {
      throw new Error(
        "Could not retrieve the footwear image."
      );
    }

    const productType = (
      productResponse.headers.get("content-type") || ""
    ).split(";")[0];

    const productBytes = Buffer.from(
      await productResponse.arrayBuffer()
    );

    if (
      !ALLOWED_TYPES.has(productType) ||
      productBytes.length > MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            "The selected product image has an unsupported format or size.",
        },
        { status: 400 }
      );
    }

    const feetBytes = Buffer.from(
      await feetPhoto.arrayBuffer()
    );

    const feetImage = await toFile(
      feetBytes,
      "customer-feet",
      { type: feetPhoto.type }
    );

    const footwearImage = await toFile(
      productBytes,
      "reference-footwear",
      { type: productType }
    );

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 240000,
      maxRetries: 1,
    });

    const prompt = `
Create one photorealistic virtual footwear try-on image.

REFERENCE IMAGE 1:
The customer's real feet and surrounding environment.
This is the PRIMARY image to edit.

REFERENCE IMAGE 2:
The exact footwear product named "${productName}".

TASK:
Place the footwear design from reference image 2
naturally onto the customer's feet in reference image 1.

IMPORTANT:
- Preserve the customer's original feet, ankles,
  legs, skin tone and natural proportions.
- Preserve the customer's pose and camera perspective.
- Preserve the background and surrounding environment.
- Reproduce the footwear design as faithfully as possible.
- Match straps, sole, shape, colours, texture and details.
- Make the footwear sit realistically on the feet.
- Respect shadows, lighting and perspective.
- Do not invent additional feet, toes or legs.
- Do not change the person's identity or body shape.
- Do not add text, labels, logos or watermarks.
- Do not produce a collage or side-by-side comparison.
- Return a single finished realistic try-on photograph.

If the customer's feet are not fully visible,
make the most plausible visual preview without
inventing unnecessary body parts.

The result is a visual styling simulation,
not a guarantee of physical fit.
`;

    const result = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      image: [feetImage, footwearImage],
      prompt,
      quality: "medium",
      size: "auto",
    });

    const base64 = result.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error(
        "The AI did not return a try-on image."
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: `data:image/png;base64,${base64}`,
    });
  } catch (error) {
    console.error("VIRTUAL TRY-ON ERROR:", error);

    const message =
      error?.status === 429
        ? "The AI service is busy or your API limit has been reached."
        : error?.status === 401
          ? "The OpenAI API key was rejected."
          : error?.message ||
            "Unable to generate your try-on.";

    return NextResponse.json(
      { error: message },
      { status: error?.status === 429 ? 429 : 500 }
    );
  }
}
export const POST = withAiPass(existingPOST);