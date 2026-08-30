"use client";

import {
  ArrowLeft,
  ImagePlus,
  Loader2,
} from "lucide-react";

import Link from "next/link";

import {
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "../../../../lib/supabase/client";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

export default function NewProduct() {
  const router =
    useRouter();

  const supabase =
    createClient();

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [category, setCategory] =
    useState("Slides");

  const [sizes, setSizes] =
    useState(
      ["36", "37", "38", "39", "40", "41", "42"]
    );

  const [files, setFiles] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function toggleSize(
    size
  ) {
    setSizes((previous) =>
      previous.includes(size)
        ? previous.filter(
            (item) =>
              item !== size
          )
        : [
            ...previous,
            size,
          ]
    );
  }

  async function uploadImages() {
    const urls = [];

    for (
      const file of files
    ) {
      const extension =
        file.name
          .split(".")
          .pop();

      const fileName =
        `${crypto.randomUUID()}.${extension}`;

      const path =
        `${slugify(name)}/${fileName}`;

      const {
        error,
      } =
        await supabase.storage
          .from("products")
          .upload(
            path,
            file,
            {
              cacheControl:
                "3600",
              upsert: false,
            }
          );

      if (error) {
        throw error;
      }

      const {
        data,
      } =
        supabase.storage
          .from("products")
          .getPublicUrl(
            path
          );

      urls.push(
        data.publicUrl
      );
    }

    return urls;
  }

  async function submit(
    event
  ) {
    event.preventDefault();

    setLoading(true);

    setError("");

    try {
      if (!name) {
        throw new Error(
          "Please enter a product name."
        );
      }

      if (!price) {
        throw new Error(
          "Please enter a price."
        );
      }

      if (!files.length) {
        throw new Error(
          "Please upload at least one image."
        );
      }

      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push(
          "/admin/login"
        );
        return;
      }

      const {
        data: admin,
      } =
        await supabase
          .from("admin_users")
          .select("user_id")
          .eq(
            "user_id",
            user.id
          )
          .single();

      if (!admin) {
        throw new Error(
          "You do not have admin access."
        );
      }

      const images =
        await uploadImages();

      const {
        error:
          productError,
      } =
        await supabase
          .from("products")
          .insert({
            name,

            slug:
              `${slugify(name)}-${Date.now()}`,

            description,

            price:
              Number(price),

            category,

            images,

            sizes,

            allow_custom_colors:
              true,

            is_active:
              true,

            is_new:
              true,

            is_featured:
              false,

            is_bestseller:
              false,
          });

      if (productError) {
        throw productError;
      }

      router.push(
        "/admin/products"
      );

      router.refresh();

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not create product."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF9F4]">

      <div className="mx-auto max-w-3xl px-5 py-10">

        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm font-bold text-black/40"
        >
          <ArrowLeft
            size={15}
          />
          Back to dashboard
        </Link>

        <h1 className="mt-8 text-5xl font-black text-[#2A211C]">
          Add footwear.
        </h1>

        <p className="mt-3 text-black/40">
          Upload it once. Every Step
          handles the rest.
        </p>

        <form
          onSubmit={submit}
          className="mt-10 space-y-6"
        >

          <div className="rounded-[2rem] bg-white p-7">

            <label className="text-xs font-black uppercase tracking-wider text-black/40">
              Product name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Ayo Slide"
              className="mt-3 w-full rounded-xl border border-black/10 px-4 py-4 outline-none focus:border-[#F4A261]"
            />

          </div>


          <div className="rounded-[2rem] bg-white p-7">

            <label className="text-xs font-black uppercase tracking-wider text-black/40">
              Price
            </label>

            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
              placeholder="25000"
              className="mt-3 w-full rounded-xl border border-black/10 px-4 py-4 outline-none focus:border-[#F4A261]"
            />

          </div>


          <div className="rounded-[2rem] bg-white p-7">

            <label className="text-xs font-black uppercase tracking-wider text-black/40">
              Category
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="mt-3 w-full rounded-xl border border-black/10 px-4 py-4 outline-none"
            >
              <option>
                Slides
              </option>

              <option>
                Sandals
              </option>

              <option>
                Heels
              </option>

              <option>
                Flats
              </option>

              <option>
                Slippers
              </option>
            </select>

          </div>


          <div className="rounded-[2rem] bg-white p-7">

            <label className="text-xs font-black uppercase tracking-wider text-black/40">
              Description
            </label>

            <textarea
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={5}
              placeholder="Tell customers about this design..."
              className="mt-3 w-full resize-none rounded-xl border border-black/10 px-4 py-4 outline-none focus:border-[#F4A261]"
            />

          </div>


          {/* SIZES */}

          <div className="rounded-[2rem] bg-white p-7">

            <label className="text-xs font-black uppercase tracking-wider text-black/40">
              Available sizes
            </label>

            <div className="mt-4 grid grid-cols-4 gap-2">

              {[
                "36",
                "37",
                "38",
                "39",
                "40",
                "41",
                "42",
                "43",
              ].map(
                (size) => (
                  <button
                    type="button"
                    key={size}
                    onClick={() =>
                      toggleSize(
                        size
                      )
                    }
                    className={`rounded-xl border py-3 text-sm font-black ${
                      sizes.includes(
                        size
                      )
                        ? "border-[#F4A261] bg-[#F4A261]"
                        : "border-black/10"
                    }`}
                  >
                    {size}
                  </button>
                )
              )}

            </div>

          </div>


          {/* IMAGES */}

          <div className="rounded-[2rem] bg-white p-7">

            <label className="text-xs font-black uppercase tracking-wider text-black/40">
              Product photos
            </label>

            <label className="mt-4 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/10 bg-[#FFF9F4] transition hover:border-[#F4A261]">

              <ImagePlus
                size={30}
                className="text-[#E8895B]"
              />

              <p className="mt-4 font-black">
                Upload footwear
              </p>

              <p className="mt-1 text-xs text-black/35">
                PNG, JPG or WEBP
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setFiles(
                    Array.from(
                      e.target.files ||
                        []
                    )
                  )
                }
                className="hidden"
              />

            </label>

            {files.length >
              0 && (
              <p className="mt-4 text-sm text-black/50">
                {files.length} image
                {files.length >
                1
                  ? "s"
                  : ""}{" "}
                selected
              </p>
            )}

          </div>


          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}


          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F4A261] px-6 py-5 font-black text-[#2A211C] disabled:opacity-50"
          >

            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Publishing...
              </>
            ) : (
              "Publish footwear 🧡"
            )}

          </button>

        </form>

      </div>

    </main>
  );
}