import { NextResponse } from "next/server";
import OpenAI from "openai";
import { withAiPass } from "@/lib/with-ai-pass";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function existingPOST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");
    const color = formData.get("color");

    if (!image) {
      return NextResponse.json(
        {
          error: "No image was provided.",
        },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json(
        {
          error: "No colour was provided.",
        },
        { status: 400 }
      );
    }

    let imageFile;

    /*
     * Uploaded images arrive as File objects.
     * Do NOT pass a File directly to fetch().
     */

    if (image instanceof File) {
      imageFile = image;
    }

    /*
     * If the image is a URL string, download it first.
     */

    else if (typeof image === "string") {
      const imageResponse = await fetch(image);

      if (!imageResponse.ok) {
        throw new Error(
          `Could not download the footwear image. Status: ${imageResponse.status}`
        );
      }

      const imageBuffer =
        Buffer.from(
          await imageResponse.arrayBuffer()
        );

      imageFile = new File(
        [imageBuffer],
        "footwear.png",
        {
          type:
            imageResponse.headers.get(
              "content-type"
            ) || "image/png",
        }
      );
    }

    else {
      throw new Error(
        "Invalid image format."
      );
    }

    const result =
      await openai.images.edit({
        model: "gpt-image-2",

        image: imageFile,

        prompt: `
Edit the provided photograph.

IMPORTANT:
This is NOT a request to redesign or regenerate the footwear.

Change ONLY the colour of the existing footwear to:

${color}

The footwear in the output must remain the SAME physical footwear
shown in the input photograph.

Preserve exactly:

- footwear shape
- footwear silhouette
- straps
- sole
- stitching
- seams
- texture
- material
- edges
- folds
- shadows
- highlights
- reflections
- person's feet
- person's skin
- background
- camera angle
- perspective
- position
- scale
- composition
- framing

DO NOT:

- create a new footwear design
- change the footwear shape
- change the straps
- change the sole
- add straps
- remove straps
- change the person's feet
- change the background
- change the lighting
- change the camera angle
- crop the image
- zoom the image
- move the footwear
- add objects
- remove objects

The ONLY visual modification should be the colour
of the existing footwear.

Keep all original texture, stitching, shadows,
highlights and material characteristics.

The final image should look like the ORIGINAL
photograph of the SAME handmade footwear,
except that its colour is now ${color}.

This is a strict colour-change edit.
Do not reinterpret the photograph.
Do not regenerate the footwear.
Preserve the original image as closely as possible.
`,

        size: "auto",

        quality: "low",
      });

    const imageData =
      result?.data?.[0];

    if (!imageData) {
      throw new Error(
        "OpenAI did not return an edited image."
      );
    }

    let imageUrl = null;

    /*
     * GPT Image models normally return
     * base64 image data.
     */

    if (imageData.b64_json) {
      imageUrl =
        `data:image/png;base64,${imageData.b64_json}`;
    }

    /*
     * Some image responses may provide
     * a URL instead.
     */

    else if (imageData.url) {
      imageUrl = imageData.url;
    }

    if (!imageUrl) {
      throw new Error(
        "OpenAI returned an image response without image data."
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      color,
    });

  } catch (error) {
    console.error(
      "EVERY STEP OPENAI AI ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "AI colour change failed.",
      },
      { status: 500 }
    );
  }
}
export const POST = withAiPass(existingPOST);