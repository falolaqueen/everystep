"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function ProductCard({
  product,
}) {
  const image =
    product.images?.[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
    >

      <article className="overflow-hidden rounded-[2rem] border border-black/5 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-2xl">

        <div className="relative aspect-square overflow-hidden bg-[#F4EFEA]">

          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              👡
            </div>
          )}

          {product.is_new && (
            <span className="absolute left-4 top-4 rounded-full bg-[#F4A261] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#2A211C]">
              New
            </span>
          )}

          <div className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white opacity-0 shadow-xl transition group-hover:opacity-100">
            <ArrowUpRight
              size={18}
            />
          </div>

        </div>

        <div className="p-5">

          <div className="flex items-start justify-between gap-3">

            <div>

              <h3 className="font-black text-[#2A211C]">
                {product.name}
              </h3>

              <p className="mt-1 text-xs text-black/35">
                {product.category}
              </p>

            </div>

            <p className="font-black text-[#C9683F]">
              ₦
              {Number(
                product.price
              ).toLocaleString()}
            </p>

          </div>

        </div>

      </article>

    </Link>
  );
}