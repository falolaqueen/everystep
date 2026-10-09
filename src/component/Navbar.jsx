"use client";

import { Menu, X, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const { items } = useCart();
  const itemCount = items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) setSignedIn(!!data?.user); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(!!session?.user);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  const accountHref = signedIn ? "/profile" : "/account?next=%2Fprofile";
  return <>
    <nav className="fixed left-1/2 top-4 z-50 flex w-[calc(100%_-_32px)] max-w-6xl -translate-x-1/2 items-center justify-between rounded-full border border-black/5 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-5">
      <Link href="/" className="shrink-0 text-xl font-black tracking-[-0.05em]">every<span className="text-[#F4A261]">step</span>.</Link>
      <div className="hidden items-center gap-6 text-sm font-medium md:flex lg:gap-8"><Link href="/colorPlay" className="whitespace-nowrap transition hover:text-[#F4A261]">Step Ai</Link><Link href="/shop" className="whitespace-nowrap transition hover:text-[#E8895B]">Shop</Link></div>
      <div className="flex shrink-0 items-center gap-2">
        <Link href={accountHref} aria-label={signedIn ? "My profile" : "Sign in or create account"} title={signedIn ? "My Profile" : "Sign In / Create Account"} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F4A261]/40 bg-[#FFF3E8] text-[#2A211C] transition hover:scale-105 hover:bg-[#F4A261] sm:h-11 sm:w-11"><UserRound size={19}/></Link>
        <Link href="/cart" aria-label="Shopping cart" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#2A211C] text-white transition hover:scale-105 sm:h-11 sm:w-11"><ShoppingBag size={18}/>{itemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F4A261] px-1 text-[10px] font-black text-[#2A211C]">{itemCount}</span>}</Link>
        <button type="button" onClick={() => setMenuOpen(v => !v)} className="rounded-full p-2 md:hidden" aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>
    </nav>
    {menuOpen && <div className="fixed left-4 right-4 top-20 z-40 rounded-3xl border border-black/5 bg-white p-6 shadow-xl md:hidden"><div className="flex flex-col gap-5 text-lg font-semibold"><Link href="/colorPlay" onClick={() => setMenuOpen(false)}>Colour Playground</Link><Link href="/shop" onClick={() => setMenuOpen(false)}>Shop</Link><Link href={accountHref} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-[#D97842]"><UserRound size={20}/>{signedIn ? "My Profile" : "Sign In / Create Account"}</Link><Link href="/#about" onClick={() => setMenuOpen(false)}>Our Story</Link></div></div>}
  </>;
}
