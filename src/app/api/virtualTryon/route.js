
import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { withAiPass } from "@/lib/with-ai-pass";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function validFile(file) {
  return (
    file instanceof File &&
    ALLOWED_TYPES.has(file.type) &&
    file.size > 0 &&
    file.size <= MAX_BYTES
  );
}

function publicProductImage(urlString) {
  try {
    const url = new URL(urlString);
    const supabase = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );

    return (
      url.protocol === "https:" &&
      url.origin === supabase.origin &&
      url.pathname.startsWith(
        "/storage/v1/object/public/product-images/"
      )
    );
  } catch {
    return false;
  }
}

function errorResponse(message, status = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

async function convertToOpenAIFile(file, name) {
  const bytes = Buffer.from(await file.arrayBuffer());

  return toFile(bytes, name, {
    type: file.type,
  });
}

async function getProductFile(url) {
  if (!publicProductImage(url)) {
    throw Object.assign(
      new Error("Please select a valid Every Step product image."),
      { status: 400 }
    );
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw Object.assign(
      new Error("Unable to download the selected footwear image."),
      { status: 400 }
    );
  }

  const type = (
    response.headers.get("content-type") || ""
  ).split(";")[0].trim().toLowerCase();

  if (!ALLOWED_TYPES.has(type)) {
    throw Object.assign(
      new Error("The footwear image must be JPG, PNG or WebP."),
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());

  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw Object.assign(
      new Error("The footwear image must be under 8 MB."),
      { status: 400 }
    );
  }

  return toFile(bytes, "product-footwear", { type });
}

async function virtualTryOnPOST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return errorResponse(
        "OPENAI_API_KEY is missing from the server environment."
      );
    }

    let form;

    try {
      form = await request.formData();
    } catch {
      return errorResponse(
        "Unable to read uploaded images. Please try again.",
        400
      );
    }

    const feetPhoto = form.get("feetPhoto");
    const footwearPhoto = form.get("footwearPhoto");
    const productImage = form.get("productImage");

    const productName = String(
      form.get("productName") || "footwear"
    ).slice(0, 120);

    if (!validFile(feetPhoto)) {
      return errorResponse(
        "Upload a clear JPG, PNG or WebP photo of your feet under 8 MB.",
        400
      );
    }

    let footwearFile;

    // Option A: Customer uploads their own footwear,
    // or sends an image customised in Colour Playground.
    if (footwearPhoto instanceof File) {
      if (!validFile(footwearPhoto)) {
        return errorResponse(
          "Upload a JPG, PNG or WebP footwear photo under 8 MB.",
          400
        );
      }

      footwearFile = await convertToOpenAIFile(
        footwearPhoto,
        "reference-footwear"
      );
    }

    // Option B: Customer selects footwear from the catalogue.
    else if (
      typeof productImage === "string" &&
      productImage.trim()
    ) {
      footwearFile = await getProductFile(productImage);
    }

    else {
      return errorResponse(
        "Select footwear from the catalogue or upload your own footwear photo.",
        400
      );
    }

    const feetFile = await convertToOpenAIFile(
      feetPhoto,
      "customer-feet"
    );

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 240000,
      maxRetries: 1,
    });

    const prompt = `
Create ONE realistic virtual footwear try-on photograph.

IMAGE 1:
The customer's actual feet, legs and environment.
This is the primary photograph to edit.

IMAGE 2:
The reference footwear design: ${productName}.

TASK:
Place the footwear shown in image 2 onto the customer's
feet in image 1, producing one natural-looking photograph.

REQUIREMENTS:
- Preserve the customer's feet, ankles, legs and skin tone.
- Preserve the original pose, camera angle and background.
- Preserve the footwear design from the second image.
- Match the footwear colour, straps, shape, sole and texture.
- Make the footwear appear naturally worn.
- Match the lighting, perspective and shadows.
- Do not change the person's body or identity.
- Do not add extra feet, toes, hands or legs.
- Do not create a collage or before-and-after comparison.
- Do not add text, labels or watermarks.
- Return one finished photorealistic image.

The customer's photograph must remain the primary scene.
The second image is only the footwear reference.

This is a visual styling preview, not a physical fit guarantee.
`;

    console.info("VIRTUAL TRY-ON: Starting image edit");

    const output = await client.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      image: [feetFile, footwearFile],
      prompt,
      size: "1024x1024",
      quality: "medium",
    });

    const image = output?.data?.[0];

    if (!image) {
      console.error(
        "VIRTUAL TRY-ON: OpenAI returned no image data."
      );

      return errorResponse(
        "OpenAI did not generate an image. Please try again.",
        502
      );
    }

    let imageUrl = null;

    if (
      typeof image.b64_json === "string" &&
      image.b64_json.length > 0
    ) {
      imageUrl = `data:image/png;base64,${image.b64_json}`;
    } else if (
      typeof image.url === "string" &&
      image.url.startsWith("https://")
    ) {
      imageUrl = image.url;
    }

    if (!imageUrl) {
      console.error(
        "VIRTUAL TRY-ON: Unexpected OpenAI image response."
      );

      return errorResponse(
        "OpenAI returned an image response that could not be displayed.",
        502
      );
    }

    console.info("VIRTUAL TRY-ON: Generation completed");

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    const status = Number(error?.status) || 500;

    console.error("VIRTUAL TRY-ON ERROR:", {
      message: error?.message,
      status,
      code: error?.code,
      type: error?.type,
    });

    if (status === 401) {
      return errorResponse(
        "OpenAI rejected the API key.",
        401
      );
    }

    if (status === 403) {
      return errorResponse(
        "This OpenAI project does not have access to the selected image model.",
        403
      );
    }

    if (status === 429) {
      return errorResponse(
        "OpenAI rate limit or API quota reached. Check your API billing and try again.",
        429
      );
    }

    if (status === 400) {
      return errorResponse(
        error?.message || "Invalid image generation request.",
        400
      );
    }

    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    ) {
      return errorResponse(
        "Virtual Try-On timed out. Please try again.",
        504
      );
    }

    return errorResponse(
      error?.message ||
        "Virtual Try-On could not generate an image.",
      500
    );
  }
}

export const POST = withAiPass(virtualTryOnPOST);