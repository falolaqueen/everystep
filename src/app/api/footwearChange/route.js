
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { withAiPass } from "@/lib/with-ai-pass";

export const runtime = "nodejs";

async function existingPOST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing from the server environment." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const formData = await request.formData();
    const image = formData.get("image");
    const color = formData.get("color");

    if (!image) {
      return NextResponse.json(
        { error: "No image was provided." },
        { status: 400 }
      );
    }

    if (!color || typeof color !== "string") {
      return NextResponse.json(
        { error: "No valid colour was provided." },
        { status: 400 }
      );
    }

    let imageFile;

    if (image instanceof File) {
      imageFile = image;
    } else if (typeof image === "string") {
      const imageResponse = await fetch(image);

      if (!imageResponse.ok) {
        throw new Error(
          `Could not download footwear image. Status: ${imageResponse.status}`
        );
      }

      const buffer = Buffer.from(
        await imageResponse.arrayBuffer()
      );

      const contentType =
        imageResponse.headers.get("content-type") || "image/png";

      const extension = contentType.includes("jpeg")
        ? "jpg"
        : contentType.includes("webp")
          ? "webp"
          : "png";

      imageFile = new File(
        [buffer],
        `footwear.${extension}`,
        { type: contentType }
      );
    } else {
      throw new Error("Invalid image format.");
    }

    const result = await openai.images.edit({
      model: "gpt-image-2.5-sunburst",
      image: imageFile,

      prompt: `
Edit the provided photograph.

Change ONLY the colour of the existing footwear to: ${color}.

This is a strict colour-change edit, NOT a footwear redesign.

Preserve the original footwear's:
- Shape and silhouette
- Straps, sole and construction
- Stitching, seams and texture
- Material and surface details
- Shadows, highlights and reflections

Preserve the person's feet, skin, background, lighting,
camera angle, perspective, framing, position and composition.

Do not add, remove, redesign, crop, zoom or reposition anything.

Only modify the colour of the existing footwear.
Retain the original material characteristics and realistic
shading so the result looks like the same photograph.

The final result must show the same physical footwear
in the requested colour: ${color}.
`,

      size: "auto",
      quality: "low",
      output_format: "png",
    });

    const imageData = result?.data?.[0];

    if (!imageData?.b64_json) {
      throw new Error(
        "OpenAI did not return edited image data."
      );
    }

    const imageUrl =
      `data:image/png;base64,${imageData.b64_json}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      color,
    });

  } catch (error) {
    console.error("EVERY STEP AI COLOUR ERROR:", error);

    return NextResponse.json(
      {
        error:
          error?.message || "AI colour change failed.",
      },
      { status: error?.status || 500 }
    );
  }
}

export const POST = withAiPass(existingPOST);