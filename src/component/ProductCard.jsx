
"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { getEffectivePrice } from "@/lib/pricing";

export default function ProductCard({
  product,
  saleSettings = {},
}) {
  const image = product.images?.[0];

  const pricing = getEffectivePrice(product, saleSettings);

  const formatPrice = (amount) =>
    Number(amount).toLocaleString("en-NG", {
      maximumFractionDigits: 2,
    });

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
    >
      <article className="overflow-hidden rounded-[2rem] border border-black/5 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-2xl">

        {/* PRODUCT IMAGE */}
        <div className="relative aspect-square overflow-hidden bg-[#F4EFEA]">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              width={300}
              height={300}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              👡
            </div>
          )}

          {/* NEW / SALE BADGES */}
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {pricing.onSale && (
              <span className="rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                {pricing.percentOff}% OFF
              </span>
            )}

            {product.is_new && (
              <span className="rounded-full bg-[#F4A261] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#2A211C]">
                New
              </span>
            )}
          </div>

          <div className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white opacity-0 shadow-xl transition group-hover:opacity-100">
            <ArrowUpRight size={18} />
          </div>
        </div>

        {/* PRODUCT DETAILS */}
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

            <div className="text-right">
              {pricing.onSale && (
                <p className="text-xs font-semibold text-black/35 line-through">
                  ₦{formatPrice(pricing.original)}
                </p>
              )}

              <p className="font-black text-[#C9683F]">
                ₦{formatPrice(pricing.final)}
              </p>

              {pricing.onSale && (
                <p className="mt-1 text-[10px] font-bold text-green-700">
                  Save ₦{formatPrice(pricing.savings)}
                </p>
              )}
            </div>
          </div>
        </div>

      </article>
    </Link>
  );
}
