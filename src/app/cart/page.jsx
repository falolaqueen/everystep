"use client";

import Link from "next/link";

import { ArrowLeft, CheckCircle2, MessageCircle, Minus, Plus, Trash2, X } from "lucide-react";

import { useState } from "react";

import { useCart } from "../../component/CartProvider";

export default function CartPage() {

  const { items, removeItem, updateQuantity, clearCart, total } = useCart();

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [customer, setCustomer] = useState({ name: "", phone: "", location: "", note: "" });

  const [checkoutBusy, setCheckoutBusy] = useState(false);

const [checkoutError, setCheckoutError] = useState("");

const [accountPromptOpen, setAccountPromptOpen] = useState(false);

  function showCheckoutForm() {

    if (!items.length) return;

    setCheckoutOpen(true);

  }

  function openCheckout() {

  if (!items.length) return;

  setAccountPromptOpen(true);

}

async function checkout(e) {

  e.preventDefault();

  if (checkoutBusy || !items.length) return;

  setCheckoutBusy(true);

  setCheckoutError("");

  try {

    const response = await fetch("/api/orders/create", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        customer,

        items: items.map(i => ({

          productId: i.productId,

          quantity: i.quantity,

          size: i.size,

          color: i.color,

            // Preserve the exact saved footwear design when available.
            // The server validates that the image is hosted in our Supabase bucket.
            image: i.image,
            customizedImageUrl: i.customizedImageUrl || i.customized_image_url || i.customImageUrl || i.custom_image_url || i.finalImageUrl || i.final_image_url || i.previewImageUrl || i.preview_image_url || null,

        })),

      }),

    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Unable to create order");

    if (!data.nextStep || typeof data.nextStep !== "string" || !data.nextStep.startsWith("/checkout/payment/")) {

      throw new Error("Payment page is unavailable. Please try again.");

    }

    window.location.assign(data.nextStep);

    setCheckoutOpen(false);

    // Keep cart available until payment is verified.

  } catch (error) {

    setCheckoutError(error.message || "Checkout failed");

  } finally {

    setCheckoutBusy(false);

  }

}

  return (

    <main className="shell py-10 sm:py-16">

      <Link href="/shop" className="text-sm pl-4 font-black"><ArrowLeft className="mr-2 inline" size={16}/> Continue shopping</Link>

      <div className="mt-8 grid gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">

        <section>

          <div className="flex items-end justify-between gap-4">

            <div>

              <p className="text-xs font-black uppercase tracking-[.25em] text-[#d97745]">Collections</p>

              <h1 className="mt-2 text-4xl font-black">Your steps 🧡</h1>

            </div>

            {items.length > 0 && <button onClick={clearCart} className="text-xs font-black text-black/40 hover:text-red-500">Clear bag</button>}

          </div>

          {!items.length ? (

            <div className="mt-8 rounded-[2rem] bg-white p-12 text-center shadow-sm">

              <div className="text-6xl">🛍️</div>

              <h2 className="mt-4 text-xl font-black">Your bag is empty, that shouldn't be.</h2>

              <p className="mx-auto mt-2 max-w-sm text-sm text-black/45">Go find a pair, play with the colours, choose your size, and bring your favourite design home. I mean now.</p>

              <Link href="/shop" className="mt-6 inline-block rounded-full bg-[#f4a261] px-6 py-3 font-black">Find a pair</Link>

            </div>

          ) : (

            <div className="mt-6 space-y-4">

              {items.map((item) => (

                <article key={item.cartId} className="rounded-[2rem] bg-white p-4 shadow-sm sm:flex sm:gap-5">

                  <img src={item.image} alt={item.name} className="aspect-square w-full rounded-[1.5rem] bg-[#f1ece6] object-cover sm:h-36 sm:w-36" />

                  <div className="flex-1 p-1 sm:p-0">

                    <div className="mt-4 flex justify-between gap-3 sm:mt-0">

                      <div>

                        <h3 className="font-black">{item.name}</h3>

                        <p className="mt-1 text-xs text-black/45">Size {item.size} · {item.color}</p>

                      </div>

                      <button onClick={() => removeItem(item.cartId)} aria-label={`Remove ${item.name}`} className="h-9 w-9 rounded-full bg-red-50 text-red-500"><Trash2 size={16} className="mx-auto" /></button>

                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

                      <div className="flex items-center gap-3 rounded-full bg-[#f7f2ed] p-1">

                        <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)} className="h-8 w-8 rounded-full bg-white"><Minus size={14} className="mx-auto"/></button>

                        <span className="min-w-5 text-center text-sm font-black">{item.quantity}</span>

                        <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)} className="h-8 w-8 rounded-full bg-white"><Plus size={14} className="mx-auto"/></button>

                      </div>

                      <p className="font-black">₦{(item.price * item.quantity).toLocaleString()}</p>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

        <aside className="h-fit rounded-[2rem] bg-[#2a211c] p-7 text-white lg:sticky lg:top-24">

          <p className="text-xs font-black uppercase tracking-[.2em] text-[#f4a261]">Order summary</p>

          <div className="mt-7 space-y-3 text-sm">

            <div className="flex justify-between text-white/50"><span>Items</span><span>{items.reduce((n, x) => n + x.quantity, 0)}</span></div>

            <div className="flex justify-between border-t border-white/10 pt-4"><span className="text-white/50">Total</span><strong className="text-2xl">₦{total.toLocaleString()}</strong></div>

          </div>

          <button onClick={openCheckout} disabled={!items.length} className="mt-7 w-full rounded-full bg-[#f4a261] px-5 py-4 font-black text-[#2a211c] disabled:opacity-30"><MessageCircle className="mr-2 inline" size={17}/> Proceed to payment</button>

          <p className="mt-4 text-center text-xs leading-5 text-white/35">Pay by bank transfer and upload your receipt for verification. </p>

        </aside>

      </div>

      {accountPromptOpen && (

                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6">

                      <div

                        role="dialog"

                        aria-modal="true"

                        aria-labelledby="account-prompt-title"

                        className="relative w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-9"

                      >

                        <button

                          type="button"

                          aria-label="Close"

                          onClick={() => setAccountPromptOpen(false)}

                          className="absolute right-5 top-5 text-[#2a211c]/60 hover:text-[#2a211c]"

                        >

                          ✕

                        </button>

                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1e3] text-3xl">

                          🎁

                        </div>

                        <h2

                          id="account-prompt-title"

                          className="mb-3 text-2xl font-black text-[#2a211c]"

                        >

                          Make Every Step Rewarding!

                        </h2>

                        <p className="mb-6 text-sm leading-7 text-[#2a211c]/70">

                          Create a free account to earn Step Coins on eligible

                          purchases, unlock rewards, and enjoy more benefits.

                          Or continue shopping as a guest!

                        </p>

                        <a

                          href="/account?next=/cart"

                          className="mb-3 block w-full rounded-full bg-[#f4a261] px-5 py-4 font-bold text-[#2a211c] transition hover:opacity-90"

                        >

                          Create a Free Account

                        </a>

                        <button

                          type="button"

                          onClick={() => {

                            setAccountPromptOpen(false);

                            showCheckoutForm();

                          }}

                          className="w-full rounded-full border border-[#2a211c]/20 px-5 py-4 font-bold text-[#2a211c] transition hover:bg-gray-50"

                        >

                          Continue to Checkout

                        </button>

                        <p className="mt-5 text-xs text-[#2a211c]/50">

                          No account required to place an order.

                        </p>

                      </div>

                    </div>

                  )}

        {checkoutOpen && (

        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#2a211c]/70 p-4 backdrop-blur-sm">

          <div className="mx-auto my-8 max-w-lg rounded-[2rem] bg-white p-7 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#d97745]">Almost there</p><h2 className="mt-2 text-3xl font-black">Where should we send it?</h2><p className="mt-2 text-sm text-black/45">We'll use these details for your order.</p></div>

              <button onClick={() => setCheckoutOpen(false)} className="h-10 w-10 rounded-full bg-[#f7f2ed]"><X className="mx-auto" size={18}/></button>

            </div>

            <form onSubmit={checkout} className="mt-7 space-y-4">

              <input required value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Your name" className="w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none focus:ring-2 focus:ring-[#f4a261]" />

              <input required value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="Phone number" type="tel" className="w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none focus:ring-2 focus:ring-[#f4a261]" />

              <textarea required value={customer.location} onChange={e => setCustomer({ ...customer, location: e.target.value })} placeholder="Delivery location" className="min-h-24 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none focus:ring-2 focus:ring-[#f4a261]" />

              <textarea value={customer.note} onChange={e => setCustomer({ ...customer, note: e.target.value })} placeholder="Anything else you'd like us to know? (optional)" className="min-h-20 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none focus:ring-2 focus:ring-[#f4a261]" />

              <div className="rounded-2xl bg-[#fff8f1] p-4 text-sm">

                <div className="flex items-center gap-2 font-black"><CheckCircle2 size={17} className="text-[#d97745]"/> {items.length} design{items.length > 1 ? "s" : ""} · ₦{total.toLocaleString()}</div>

              </div>

              {checkoutError && <p role="alert" className="text-sm text-red-600">{checkoutError}</p>}

                <p className="text-sm text-black/60">Accounts are optional. <a href="/account" className="underline">Create an account or sign in to earn Step Coins</a>.</p>

              <button

                type="submit"

                className="w-full rounded-full bg-[#f4a261] py-4 font-black text-[#2a211c] disabled:cursor-not-allowed disabled:opacity-60"

                disabled={checkoutBusy}

              >

                <MessageCircle className="mr-2 inline" size={17} />

                {checkoutBusy ? "Preparing order…" : "Continue to bank transfer"}

                  </button>

            </form>

          </div>

        </div>

      )}

    </main>

  );

}