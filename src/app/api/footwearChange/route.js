// import { NextResponse } from "next/server";
// import Replicate from "replicate";

// const replicate = new Replicate({
//   auth: process.env.REPLICATE_API_TOKEN,
// });

// export async function POST(request) {
//   try {
//     console.log("=================================");
//     console.log("EVERY STEP AI REQUEST STARTED");
//     console.log("=================================");

//     // --------------------------------------------------
//     // CHECK API KEY
//     // --------------------------------------------------

//     if (!process.env.REPLICATE_API_TOKEN) {
//       console.error(
//         "REPLICATE_API_TOKEN is missing."
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "REPLICATE_API_TOKEN is missing from .env.local",
//         },
//         { status: 500 }
//       );
//     }

//     console.log(
//       "Replicate API key found."
//     );

//     // --------------------------------------------------
//     // GET FORM DATA
//     // --------------------------------------------------

//     const formData =
//       await request.formData();

//     const image =
//       formData.get("image");

//     const color =
//       formData.get("color");

//     console.log(
//       "Colour requested:",
//       color
//     );

//     console.log(
//       "Image received:",
//       !!image
//     );

//     // --------------------------------------------------
//     // VALIDATE IMAGE
//     // --------------------------------------------------

//     if (!image) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "No image was uploaded.",
//         },
//         { status: 400 }
//       );
//     }

//     if (!(image instanceof File)) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "The uploaded image is not a valid File.",
//         },
//         { status: 400 }
//       );
//     }

//     // --------------------------------------------------
//     // VALIDATE COLOUR
//     // --------------------------------------------------

//     if (!color) {
//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "No colour was selected.",
//         },
//         { status: 400 }
//       );
//     }

//     // --------------------------------------------------
//     // CALL REPLICATE
//     // --------------------------------------------------

//     console.log(
//       "Sending image to Replicate..."
//     );

//     const output =
//   await replicate.run(
//     "prunaai/p-image-edit",
//     {
//       input: {
//         images: [image],

//         prompt: `
// IMAGE EDITING TASK:

// There is a pair of footwear/slippers in the reference image.

// TARGET OBJECT:
// The ONLY object that must be edited is the footwear/slippers.

// EDIT:
// Change ONLY the visible material and color of the footwear/slippers to ${color}.

// The background must remain completely unchanged.

// The person's feet must remain completely unchanged.

// Do NOT change:
// - background
// - floor
// - walls
// - furniture
// - person's skin
// - person's feet
// - clothing
// - surrounding objects
// - shadows outside the footwear
// - lighting of the scene
// - camera angle
// - composition

// Keep the EXACT SAME footwear.

// Preserve:
// - shape
// - proportions
// - straps
// - sole
// - stitching
// - texture
// - material
// - seams
// - wrinkles
// - highlights
// - shadows
// - reflections
// - perspective

// DO NOT redesign the footwear.
// DO NOT replace the footwear.
// DO NOT create a different shoe.
// DO NOT move the footwear.
// DO NOT change the footwear style.

// Only change the footwear's color to ${color}.

// The result must be a photorealistic photograph of the exact same footwear in ${color}.

// Everything outside the footwear must remain unchanged.

// EDIT ONLY THE FOOTWEAR.
// `,

//         turbo: false,

//         aspect_ratio:
//           "match_input_image",
//       },
//     }
//   );

//     console.log(
//       "Replicate returned successfully."
//     );

//     console.log(
//       "OUTPUT:",
//       output
//     );

//     // --------------------------------------------------
//     // EXTRACT IMAGE URL
//     // --------------------------------------------------

//     let imageUrl = null;

//     /*
//      * Replicate can return a single
//      * FileOutput or an array.
//      */

//     if (Array.isArray(output)) {
//       const first =
//         output[0];

//       if (first) {
//         if (
//           typeof first.url ===
//           "function"
//         ) {
//           imageUrl =
//             first.url();
//         } else {
//           imageUrl =
//             first;
//         }
//       }
//     } else if (output) {
//       if (
//         typeof output.url ===
//         "function"
//       ) {
//         imageUrl =
//           output.url();
//       } else {
//         imageUrl =
//           output;
//       }
//     }

//     // --------------------------------------------------
//     // CHECK RESULT
//     // --------------------------------------------------

//     if (!imageUrl) {
//       console.error(
//         "Replicate returned no image URL."
//       );

//       return NextResponse.json(
//         {
//           success: false,
//           error:
//             "Replicate completed but did not return an image.",
//           replicateOutput:
//             String(output),
//         },
//         { status: 500 }
//       );
//     }

//     console.log(
//       "IMAGE URL RECEIVED."
//     );

//     // --------------------------------------------------
//     // SUCCESS
//     // --------------------------------------------------

//     return NextResponse.json({
//       success: true,
//       imageUrl,
//       color,
//     });

//   } catch (error) {

//     console.error(
//       "================================="
//     );

//     console.error(
//       "EVERY STEP AI ERROR"
//     );

//     console.error(
//       "================================="
//     );

//     console.error(error);

//     console.error(
//       "Message:",
//       error?.message
//     );

//     console.error(
//       "Stack:",
//       error?.stack
//     );

//     /*
//      * IMPORTANT:
//      *
//      * Always return JSON.
//      *
//      * This prevents the frontend from
//      * receiving an HTML/plain-text
//      * response.
//      */

//     return NextResponse.json(
//       {
//         success: false,

//         error:
//           error?.message ||
//           "The AI request failed.",

//         details:
//           error?.response?.data ||
//           null,
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

import { NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime =
  "nodejs";

const replicate =
  new Replicate({
    auth:
      process.env
        .REPLICATE_API_TOKEN,
  });

export async function POST(
  request
) {
  try {
    if (
      !process.env
        .REPLICATE_API_TOKEN
    ) {
      return NextResponse.json(
        {
          error:
            "REPLICATE_API_TOKEN is missing.",
        },
        { status: 500 }
      );
    }

    const formData =
      await request.formData();

    const image =
      formData.get("image");

    const color =
      formData.get("color");

    if (!image) {
      return NextResponse.json(
        {
          error:
            "No image was provided.",
        },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json(
        {
          error:
            "No colour was provided.",
        },
        { status: 400 }
      );
    }

    const output =
      await replicate.run(
        "prunaai/p-image-edit",
        {
          input: {
            images: [image],

            prompt: `
Change ONLY the colour of the footwear.

Target colour:
${color}

Keep the exact same footwear.

Preserve:
- shape
- design
- straps
- sole
- stitching
- texture
- material
- shadows
- highlights
- lighting
- perspective
- background
- person's feet
- composition

Do NOT redesign the footwear.

Do NOT create a new shoe.

Do NOT change anything except
the footwear colour.

The result should look like the
exact same handmade footwear photographed
in the colour ${color}.
`,
          },
        }
      );

    let imageUrl = null;

    if (
      Array.isArray(output)
    ) {
      const result =
        output[0];

      if (
        result &&
        typeof result.url ===
          "function"
      ) {
        imageUrl =
          result.url();
      } else {
        imageUrl =
          result;
      }
    } else if (output) {
      if (
        typeof output.url ===
          "function"
      ) {
        imageUrl =
          output.url();
      } else {
        imageUrl =
          output;
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "Replicate did not return an image.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      color,
    });

  } catch (error) {
    console.error(
      "EVERY STEP AI ERROR:",
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