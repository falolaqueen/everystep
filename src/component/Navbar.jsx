"use client";

import {
  Menu,
  Sparkles,
  X,
  ShoppingBag,
} from "lucide-react";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { useState } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { items } = useCart();

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <>
      <nav
        className="
          fixed left-1/2 top-4 z-50
          flex w-[calc(100%_-_32px)] max-w-6xl
          -translate-x-1/2
          items-center justify-between
          rounded-full
          border border-black/5
          bg-white/80
          px-4 py-3
          shadow-sm
          backdrop-blur-xl
          sm:px-5
        "
      >

        {/* LOGO */}
        <Link
          href="/"
          className="shrink-0 text-xl font-black tracking-[-0.05em]"
        >
          every<span className="text-[#F4A261]">step</span>.
        </Link>


        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-6 text-sm font-medium md:flex lg:gap-8">

          <Link
            href="/colorPlay"
            className="whitespace-nowrap transition hover:text-[#F4A261]"
          >
            Colour Playground
          </Link>

          <Link
            href="/shop"
            className="whitespace-nowrap transition hover:text-[#E8895B]"
          >
            Shop
          </Link>

        </div>


        {/* RIGHT SIDE */}
        <div className="flex shrink-0 items-center gap-2">

          {/* CART */}
          <Link
            href="/cart"
            className="
              relative flex h-10 w-10
              items-center justify-center
              rounded-full
              bg-[#2A211C]
              text-white
              transition
              hover:scale-105
              sm:h-11 sm:w-11
            "
          >

            <ShoppingBag size={18} />

            {itemCount > 0 && (
              <span
                className="
                  absolute -right-1 -top-1
                  flex h-5 min-w-5
                  items-center justify-center
                  rounded-full
                  bg-[#F4A261]
                  px-1
                  text-[10px]
                  font-black
                  text-[#2A211C]
                "
              >
                {itemCount}
              </span>
            )}

          </Link>


          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-2 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

        </div>

      </nav>


      {/* MOBILE MENU */}
      {menuOpen && (
        <div
          className="
            fixed left-4 right-4 top-20 z-40
            rounded-3xl
            border border-black/5
            bg-white
            p-6
            shadow-xl
            md:hidden
          "
        >

          <div className="flex flex-col gap-5 text-lg font-semibold">

            <Link
              href="/colorPlay"
              onClick={() => setMenuOpen(false)}
            >
              Colour Playground
            </Link>

            <Link
              href="/shop"
              onClick={() => setMenuOpen(false)}
            >
              Shop
            </Link>

            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
            >
              Our Story
            </a>

          </div>

        </div>
      )}

    </>
  );
};

export default Navbar;