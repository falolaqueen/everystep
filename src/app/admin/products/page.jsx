import Link from "next/link";

import {
  ArrowLeft,
  Plus,
} from "lucide-react";

import { redirect } from "next/navigation";

import { createClient } from "../../../lib/supabase/server";

export const dynamic =
  "force-dynamic";

export default async function AdminProducts() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/admin/login"
    );
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
    redirect(
      "/admin/login"
    );
  }

  const {
    data: products,
  } =
    await supabase
      .from("products")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  return (
    <main className="min-h-screen bg-[#FFF9F4]">

      <div className="mx-auto max-w-6xl px-5 py-10">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-bold text-black/40"
            >
              <ArrowLeft
                size={15}
              />
              Dashboard
            </Link>

            <h1 className="mt-6 text-5xl font-black text-[#2A211C]">
              Products.
            </h1>

          </div>

          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-full bg-[#F4A261] px-5 py-3 text-sm font-black"
          >
            <Plus size={16} />
            Add footwear
          </Link>

        </div>


        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {products?.map(
            (product) => (

              <div
                key={product.id}
                className="overflow-hidden rounded-[2rem] bg-white"
              >

                <div className="aspect-square bg-[#F3EEE7]">

                  {product.images?.[0] && (
                    <img
                      src={
                        product.images[0]
                      }
                      alt={
                        product.name
                      }
                      className="h-full w-full object-cover"
                    />
                  )}

                </div>

                <div className="p-5">

                  <h2 className="font-black">
                    {product.name}
                  </h2>

                  <p className="mt-1 text-sm text-black/40">
                    ₦
                    {Number(
                      product.price
                    ).toLocaleString()}
                  </p>

                  <div className="mt-5 flex items-center justify-between">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        product.is_active
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {product.is_active
                        ? "Published"
                        : "Hidden"}
                    </span>

                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm font-black text-[#C9683F]"
                    >
                      Edit →
                    </Link>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </main>
  );
}