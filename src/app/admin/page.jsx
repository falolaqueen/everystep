// import { redirect } from "next/navigation";

// import {
//   Package,
//   ShoppingBag,
//   Plus,
//   LogOut,
// } from "lucide-react";

// import Link from "next/link";

// import { createClient } from "../../lib/supabase/server";

// export const dynamic =
//   "force-dynamic";

// export default async function AdminPage() {
//   const supabase =
//     await createClient();

//   const {
//     data: {
//       user,
//     },
//   } =
//     await supabase.auth.getUser();

//   if (!user) {
//     redirect(
//       "/admin/login"
//     );
//   }

//   const {
//     data: admin,
//   } =
//     await supabase
//       .from("admin_users")
//       .select("user_id")
//       .eq(
//         "user_id",
//         user.id
//       )
//       .single();

//   if (!admin) {
//     redirect(
//       "/admin/login"
//     );
//   }

//   const {
//     count: productCount,
//   } =
//     await supabase
//       .from("products")
//       .select(
//         "*",
//         {
//           count: "exact",
//           head: true,
//         }
//       );

//   const {
//     count: orderCount,
//   } =
//     await supabase
//       .from("orders")
//       .select(
//         "*",
//         {
//           count: "exact",
//           head: true,
//         }
//       );

//   return (
//     <main className="min-h-screen bg-[#FFF9F4]">

//       <header className="border-b border-black/5 bg-white">

//         <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">

//           <Link
//             href="/"
//             className="text-2xl font-black"
//           >
//             Every
//             <span className="text-[#E8895B]">
//               Step
//             </span>
//           </Link>

//           <form
//             action="/api/admin/logout"
//             method="POST"
//           >
//             <button className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-bold">
//               <LogOut
//                 size={14}
//               />
//               Log out
//             </button>
//           </form>

//         </div>

//       </header>


//       <section className="mx-auto max-w-7xl px-5 py-12">

//         <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9683F]">
//           Admin
//         </p>

//         <h1 className="mt-2 text-5xl font-black text-[#2A211C]">
//           Your store.
//         </h1>

//         <p className="mt-3 text-black/40">
//           Manage your Every Step
//           collection from here.
//         </p>


//         {/* STATS */}

//         <div className="mt-10 grid gap-4 sm:grid-cols-2">

//           <div className="rounded-[2rem] bg-white p-7">

//             <Package
//               className="text-[#E8895B]"
//             />

//             <p className="mt-6 text-4xl font-black">
//               {productCount ||
//                 0}
//             </p>

//             <p className="mt-1 text-sm text-black/40">
//               Products
//             </p>

//           </div>

//           <div className="rounded-[2rem] bg-[#2A211C] p-7 text-white">

//             <ShoppingBag
//               className="text-[#F4A261]"
//             />

//             <p className="mt-6 text-4xl font-black">
//               {orderCount ||
//                 0}
//             </p>

//             <p className="mt-1 text-sm text-white/40">
//               Orders
//             </p>

//           </div>

//         </div>


//         {/* ACTIONS */}

//         <div className="mt-10 grid gap-4 sm:grid-cols-2">

//           <Link
//             href="/admin/products"
//             className="group rounded-[2rem] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
//           >

//             <Package />

//             <h2 className="mt-5 text-xl font-black">
//               Manage products
//             </h2>

//             <p className="mt-2 text-sm leading-6 text-black/40">
//               Upload, edit and manage
//               your footwear collection.
//             </p>

//           </Link>

//           <Link
//             href="/admin/products/new"
//             className="rounded-[2rem] bg-[#F4A261] p-7 transition hover:-translate-y-1"
//           >

//             <Plus />

//             <h2 className="mt-5 text-xl font-black">
//               Add footwear
//             </h2>

//             <p className="mt-2 text-sm leading-6 text-[#2A211C]/50">
//               Upload a new product
//               directly from your browser.
//             </p>

//           </Link>

//         </div>

//       </section>

//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import {
  ImagePlus,
  LogOut,
  Plus,
  Trash2,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Slides",

    // STANDARD SIZES
    sizes: "36,37,38,39,40",

    // EXTRA SIZES
    extra_sizes: "41,42",

    // EXTRA SIZE FEE
    extra_size_fee: "1000",

    is_new: false,
    is_featured: false,
    is_bestseller: false,
    allow_custom_colors: true,
    is_active: true,

    stock: "",

    images: [],
  });

  useEffect(() => {
    load();
  }, []);

  // --------------------------------------------------
  // LOAD ADMIN + PRODUCTS
  // --------------------------------------------------

  async function load() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/admin/login");
      return;
    }

    const { data: admin, error: adminError } =
      await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (adminError) {
      console.error("Admin check error:", adminError);
      setLoading(false);
      return;
    }

    if (!admin) {
      await supabase.auth.signOut();
      router.replace("/admin/login");
      return;
    }

    setUser(user);

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Products loading error:", error);
      alert(error.message);
    }

    setProducts(data || []);
    setLoading(false);
  }

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  function resetForm() {
    setForm({
      name: "",
      description: "",
      price: "",
      category: "Slides",

      sizes: "36,37,38,39,40",

      extra_sizes: "41,42",

      extra_size_fee: "1000",

      is_new: false,
      is_featured: false,
      is_bestseller: false,
      allow_custom_colors: true,
      is_active: true,

      stock: "",

      images: [],
    });

    setSelectedFiles([]);
    setUploadProgress(0);
    setUploading(false);
  }

  // --------------------------------------------------
  // EDIT PRODUCT
  // --------------------------------------------------

  function edit(product) {
    setEditing(product);

    setForm({
      name: product.name || "",

      description:
        product.description || "",

      price:
        product.price ?? "",

      category:
        product.category || "Slides",

      sizes:
        Array.isArray(product.sizes)
          ? product.sizes.join(",")
          : product.sizes || "",

      extra_sizes:
        Array.isArray(product.extra_sizes)
          ? product.extra_sizes.join(",")
          : product.extra_sizes || "",

      extra_size_fee:
        product.extra_size_fee ?? 1000,

      is_new:
        !!product.is_new,

      is_featured:
        !!product.is_featured,

      is_bestseller:
        !!product.is_bestseller,

      allow_custom_colors:
        product.allow_custom_colors !== false,

      is_active:
        product.is_active !== false,

      stock:
        product.stock ?? "",

      images:
        Array.isArray(product.images)
          ? product.images.filter(Boolean)
          : [],
    });

    setSelectedFiles([]);
    setUploadProgress(0);
    setOpen(true);
  }

  // --------------------------------------------------
  // NEW PRODUCT
  // --------------------------------------------------

  function newProduct() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  // --------------------------------------------------
  // SELECT MULTIPLE IMAGES
  // --------------------------------------------------

  function handleImageSelect(event) {
    const files = Array.from(
      event.target.files || []
    );

    const imageFiles = files.filter(
      (file) =>
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/webp"
    );

    if (!imageFiles.length) {
      alert(
        "Please select PNG, JPG or WEBP images."
      );
      return;
    }

    setSelectedFiles((current) => [
      ...current,
      ...imageFiles,
    ]);

    event.target.value = "";
  }

  // --------------------------------------------------
  // REMOVE WAITING IMAGE
  // --------------------------------------------------

  function removeSelectedFile(index) {
    setSelectedFiles((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  // --------------------------------------------------
  // REMOVE EXISTING IMAGE
  // --------------------------------------------------

  function removeExistingImage(index) {
    setForm((current) => ({
      ...current,

      images: current.images.filter(
        (_, i) => i !== index
      ),
    }));
  }

  // --------------------------------------------------
  // UPLOAD IMAGES
  // --------------------------------------------------

  async function uploadImages() {
    if (!selectedFiles.length) {
      return [];
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadedUrls = [];

    try {
      for (
        let i = 0;
        i < selectedFiles.length;
        i++
      ) {
        const file = selectedFiles[i];

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const filename =
          `${crypto.randomUUID()}.${extension}`;

        const path =
          `products/${filename}`;

        console.log(
          "Uploading image:",
          path
        );

        const {
          error: uploadError,
        } = await supabase.storage
          .from("product-images")
          .upload(
            path,
            file,
            {
              cacheControl: "3600",
              contentType: file.type,
              upsert: false,
            }
          );

        if (uploadError) {
          console.error(
            "Upload error:",
            uploadError
          );

          throw new Error(
            `Could not upload "${file.name}": ${uploadError.message}`
          );
        }

        const {
          data: publicData,
        } =
          supabase.storage
            .from("product-images")
            .getPublicUrl(path);

        const publicUrl =
          publicData?.publicUrl;

        if (!publicUrl) {
          throw new Error(
            `The image uploaded, but Supabase did not return a public URL for "${file.name}".`
          );
        }

        console.log(
          "Image public URL:",
          publicUrl
        );

        uploadedUrls.push(publicUrl);

        setUploadProgress(
          Math.round(
            ((i + 1) /
              selectedFiles.length) *
              100
          )
        );
      }

      return uploadedUrls;
    } catch (error) {
      console.error(
        "Image upload failed:",
        error
      );

      throw error;
    } finally {
      setUploading(false);
    }
  }

  // --------------------------------------------------
  // SAVE PRODUCT
  // --------------------------------------------------

  async function save(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter a product name.");
      return;
    }

    if (!form.price) {
      alert("Please enter a price.");
      return;
    }

    setSaving(true);

    try {
      // ---------------------------------------------
      // UPLOAD NEW IMAGES
      // ---------------------------------------------

      let newImageUrls = [];

      if (selectedFiles.length > 0) {
        newImageUrls =
          await uploadImages();
      }

      // ---------------------------------------------
      // COMBINE OLD + NEW IMAGES
      // ---------------------------------------------

      const allImages = [
        ...(form.images || []),
        ...newImageUrls,
      ].filter(Boolean);

      // ---------------------------------------------
      // STANDARD SIZES
      // ---------------------------------------------

      const standardSizes =
        form.sizes
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean);

      // ---------------------------------------------
      // EXTRA SIZES
      // ---------------------------------------------

      const extraSizes =
        form.extra_sizes
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean);

      // ---------------------------------------------
      // PRODUCT PAYLOAD
      // ---------------------------------------------

      const payload = {
        name: form.name.trim(),

        description:
          form.description?.trim() || "",

        price:
          Number(form.price),

        category:
          form.category?.trim() ||
          "Slides",

        images:
          allImages,

        sizes:
          standardSizes,

        extra_sizes:
          extraSizes,

        extra_size_fee:
          Number(
            form.extra_size_fee || 0
          ),

        allow_custom_colors:
          !!form.allow_custom_colors,

        is_new:
          !!form.is_new,

        is_featured:
          !!form.is_featured,

        is_bestseller:
          !!form.is_bestseller,

        is_active:
          form.is_active !== false,

        stock:
          form.stock === ""
            ? null
            : Number(form.stock),
      };

      console.log(
        "Saving product:",
        payload
      );

      let result;

      // ---------------------------------------------
      // EDIT
      // ---------------------------------------------

      if (editing) {
        result =
          await supabase
            .from("products")
            .update(payload)
            .eq(
              "id",
              editing.id
            );
      }

      // ---------------------------------------------
      // CREATE
      // ---------------------------------------------

      else {
        const slug =
          form.name
            .toLowerCase()
            .trim()
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(
              /(^-|-$)/g,
              ""
            ) +
          "-" +
          Date.now();

        result =
          await supabase
            .from("products")
            .insert({
              ...payload,
              slug,
            });
      }

      if (result.error) {
        console.error(
          "Product save error:",
          result.error
        );

        alert(
          result.error.message
        );

        return;
      }

      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      setOpen(false);
      setEditing(null);

      resetForm();

      await load();

    } catch (error) {
      console.error(
        "Unexpected save error:",
        error
      );

      alert(
        error?.message ||
          "Something went wrong while saving the product."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // DELETE PRODUCT
  // --------------------------------------------------

  async function remove(product) {
    const confirmed =
      confirm(
        `Delete ${product.name}?`
      );

    if (!confirmed) return;

    const {
      error,
    } = await supabase
      .from("products")
      .delete()
      .eq(
        "id",
        product.id
      );

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  }

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  async function logout() {
    await supabase.auth.signOut();

    router.replace(
      "/admin/login"
    );
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff8f1] p-10">
        Loading your studio...
      </main>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#fff8f1]">

      {/* HEADER */}

      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">

          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#d97745]">
              Every Step
            </p>

            <h1 className="text-xl font-black">
              Studio
            </h1>
          </div>

          <button
            onClick={logout}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-black"
          >
            <LogOut
              className="mr-2 inline"
              size={14}
            />

            Sign out
          </button>

        </div>
      </header>

      {/* PRODUCTS */}

      <div className="mx-auto max-w-6xl px-5 py-10">

        <div className="flex flex-wrap items-end justify-between gap-4">

          <div>
            <p className="text-sm text-black/45">
              Hello, Queen
            </p>

            <h2 className="mt-1 text-4xl font-black">
              Your footwear.
            </h2>
          </div>

          <button
            onClick={newProduct}
            className="rounded-full bg-[#f4a261] px-5 py-3 font-black"
          >
            <Plus
              className="mr-2 inline"
              size={17}
            />

            Add footwear
          </button>

        </div>

        {/* PRODUCT GRID */}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {products.map(
            (p) => (

              <div
                key={p.id}
                className="overflow-hidden rounded-[2rem] bg-white"
              >

                <div className="aspect-square bg-[#f1ece6]">

                  {p.images?.[0] ? (

                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        console.error(
                          "Image failed to load:",
                          p.images[0]
                        );

                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                  ) : (

                    <div className="flex h-full items-center justify-center text-black/20">
                      No image
                    </div>

                  )}

                </div>

                <div className="p-5">

                  <div className="flex justify-between gap-3">

                    <h3 className="font-black">
                      {p.name}
                    </h3>

                    <b>
                      ₦
                      {Number(
                        p.price
                      ).toLocaleString()}
                    </b>

                  </div>

                  <p className="mt-1 text-xs text-black/40">
                    {p.category}
                  </p>

                  <p className="mt-1 text-xs text-black/40">
                    Standard:{" "}
                    {(p.sizes || []).join(
                      ", "
                    )}
                  </p>

                  {p.extra_sizes?.length >
                    0 && (

                    <p className="mt-1 text-xs font-bold text-[#d97745]">
                      Extra:{" "}
                      {p.extra_sizes.join(
                        ", "
                      )}
                      {" "}
                      (+₦
                      {Number(
                        p.extra_size_fee ||
                          0
                      ).toLocaleString()}
                      )
                    </p>

                  )}

                  <p className="mt-1 text-xs font-bold text-black/40">
                    {p.is_active
                      ? "Live in store"
                      : "Hidden from store"}

                    {p.stock !==
                      null &&
                    p.stock !==
                      undefined
                      ? ` · ${p.stock} in stock`
                      : ""}
                  </p>

                  <div className="mt-4 flex gap-2">

                    <button
                      onClick={() =>
                        edit(p)
                      }
                      className="flex-1 rounded-full bg-[#f7f2ed] py-2 text-xs font-black"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        remove(p)
                      }
                      className="rounded-full bg-red-50 px-4 py-2 text-red-600"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>
      </div>

      {/* MODAL */}

      {open && (

        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#2a211c]/70 p-4 backdrop-blur">

          <form
            onSubmit={save}
            className="mx-auto my-8 max-w-2xl rounded-[2rem] bg-white p-7"
          >

            {/* HEADER */}

            <div className="flex items-center justify-between">

              <h2 className="text-2xl font-black">
                {editing
                  ? "Edit footwear"
                  : "Add footwear"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSelectedFiles(
                    []
                  );
                }}
              >
                <X />
              </button>

            </div>

            {/* IMAGE UPLOAD */}

            <label className="mt-6 block text-xs font-black uppercase text-black/40">
              Product photos
            </label>

            <label className="mt-2 flex min-h-40 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-black/10 bg-[#fff8f1]">

              <div className="text-center">

                <ImagePlus
                  className="mx-auto text-[#d97745]"
                />

                <p className="mt-2 text-sm font-black">
                  Add multiple photos
                </p>

                <p className="text-xs text-black/35">
                  PNG, JPG or WEBP
                </p>

                <p className="mt-1 text-xs text-[#d97745]">
                  Select several at once
                </p>

              </div>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={
                  handleImageSelect
                }
                className="hidden"
              />

            </label>

            {/* CURRENT PHOTOS */}

            {form.images?.length >
              0 && (

              <div className="mt-4">

                <p className="mb-2 text-xs font-black uppercase text-black/40">
                  Current photos
                </p>

                <div className="grid grid-cols-4 gap-2">

                  {form.images.map(
                    (url, i) => (

                      <div
                        key={`${url}-${i}`}
                        className="relative overflow-hidden rounded-xl bg-[#f1ece6]"
                      >

                        <img
                          src={url}
                          alt={`${form.name} ${i + 1}`}
                          className="aspect-square w-full object-cover"
                          onError={() => {
                            console.error(
                              "Could not display image:",
                              url
                            );
                          }}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeExistingImage(
                              i
                            )
                          }
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                        >
                          <X
                            size={12}
                          />
                        </button>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

            {/* NEW PHOTOS */}

            {selectedFiles.length >
              0 && (

              <div className="mt-4">

                <div className="mb-2 flex items-center justify-between">

                  <p className="text-xs font-black uppercase text-[#d97745]">
                    New photos
                  </p>

                  <p className="text-xs text-black/40">
                    {selectedFiles.length} selected
                  </p>

                </div>

                <div className="grid grid-cols-4 gap-2">

                  {selectedFiles.map(
                    (file, i) => {

                      const previewUrl =
                        URL.createObjectURL(
                          file
                        );

                      return (
                        <div
                          key={`${file.name}-${i}`}
                          className="relative overflow-hidden rounded-xl"
                        >

                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="aspect-square w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeSelectedFile(
                                i
                              )
                            }
                            className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                          >
                            <X
                              size={12}
                            />
                          </button>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            )}

            {/* UPLOAD PROGRESS */}

            {uploading && (

              <div className="mt-4 rounded-2xl bg-[#fff4ea] p-4">

                <div className="flex items-center gap-3">

                  <Loader2
                    className="animate-spin text-[#d97745]"
                    size={18}
                  />

                  <div className="flex-1">

                    <div className="flex justify-between text-xs font-bold">

                      <span>
                        Uploading photos...
                      </span>

                      <span>
                        {uploadProgress}%
                      </span>

                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">

                      <div
                        className="h-full rounded-full bg-[#f4a261] transition-all"
                        style={{
                          width: `${uploadProgress}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

              </div>

            )}

            {/* NAME */}

            <input
              required
              placeholder="Product name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="mt-6 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"
            />

            {/* DESCRIPTION */}

            <textarea
              placeholder="Description"
              value={
                form.description
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              className="mt-3 min-h-28 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"
            />

            {/* PRICE + CATEGORY */}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">

              <input
                required
                type="number"
                min="0"
                placeholder="Price (₦)"
                value={
                  form.price
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    price:
                      e.target.value,
                  })
                }
                className="rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"
              />

              <input
                placeholder="Category"
                value={
                  form.category
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
                className="rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"
              />

            </div>

            {/* STOCK */}

            <input
              type="number"
              min="0"
              placeholder="Stock (optional)"
              value={
                form.stock
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  stock:
                    e.target.value,
                })
              }
              className="mt-3 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"
            />

            {/* STANDARD SIZES */}

            <div className="mt-5">

              <label className="text-xs font-black uppercase text-black/40">
                Standard sizes
              </label>

              <input
                placeholder="36,37,38,39,40"
                value={
                  form.sizes
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    sizes:
                      e.target.value,
                  })
                }
                className="mt-2 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"
              />

              <p className="mt-1 text-xs text-black/40">
                These sizes have no additional charge.
              </p>

            </div>

            {/* EXTRA SIZES */}

            <div className="mt-4">

              <label className="text-xs font-black uppercase text-black/40">
                Extra-size options
              </label>

              <input
                placeholder="41,42,43"
                value={
                  form.extra_sizes
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    extra_sizes:
                      e.target.value,
                  })
                }
                className="mt-2 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"
              />

              <p className="mt-1 text-xs text-black/40">
                Customers selecting these sizes pay the additional fee below.
              </p>

            </div>

            {/* EXTRA SIZE FEE */}

            <div className="mt-4 rounded-2xl bg-[#fff4ea] p-4">

              <label className="text-xs font-black uppercase text-[#d97745]">
                Extra-size fee
              </label>

              <div className="mt-2 flex items-center gap-2">

                <span className="font-black">
                  ₦
                </span>

                <input
                  type="number"
                  min="0"
                  value={
                    form.extra_size_fee
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      extra_size_fee:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl bg-white px-4 py-3 font-bold outline-none"
                />

              </div>

              <p className="mt-2 text-xs text-black/45">
                Example: if the product is ₦25,000 and the customer selects an extra size with a ₦1,000 fee, they pay ₦26,000.
              </p>

            </div>

            {/* OPTIONS */}

            <div className="mt-5 space-y-3 text-sm font-bold">

              {[
                [
                  "allow_custom_colors",
                  "Allow AI colour customization",
                ],
                [
                  "is_new",
                  "Mark as new",
                ],
                [
                  "is_featured",
                  "Featured product",
                ],
                [
                  "is_bestseller",
                  "Bestseller",
                ],
                [
                  "is_active",
                  "Visible in shop",
                ],
              ].map(
                ([key, label]) => (

                  <label
                    key={key}
                    className="flex items-center gap-3"
                  >

                    <input
                      type="checkbox"
                      checked={
                        !!form[key]
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [key]:
                            e.target
                              .checked,
                        })
                      }
                    />

                    {label}

                  </label>

                )
              )}

            </div>

            {/* SAVE */}

            <button
              type="submit"
              disabled={
                saving ||
                uploading
              }
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#f4a261] py-4 font-black disabled:opacity-50"
            >

              {saving ||
              uploading ? (

                <>
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />

                  {uploading
                    ? `Uploading ${uploadProgress}%`
                    : "Saving..."}
                </>

              ) : (

                <>
                  <Upload
                    size={18}
                  />

                  {editing
                    ? "Save changes"
                    : "Publish footwear"}
                </>

              )}

            </button>

          </form>

        </div>

      )}

    </main>
  );
}