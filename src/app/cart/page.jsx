// "use client";

// import Link from "next/link";
// import {
//   ArrowLeft,
//   Minus,
//   Plus,
//   Trash2,
//   MessageCircle,
// } from "lucide-react";

// import Navbar from "@/component/Navbar";
// import { useCart } from "@/component/CartProvider";
// export default function CartPage() {
//   const {
//     cart,
//     total,
//     removeFromCart,
//     updateQuantity,
//   } = useCart();

//   const whatsapp =
//     process.env
//       .NEXT_PUBLIC_WHATSAPP_NUMBER;

//   function checkout() {
//     if (!cart.length) return;

//     const lines = [
//       "Hello Every Step! 🧡",
//       "",
//       "I'd like to order:",
//       "",
//     ];

//     cart.forEach(
//       (item, index) => {
//         lines.push(
//           `${index + 1}. ${item.name}`
//         );

//         lines.push(
//           `Size: ${item.size}`
//         );

//         lines.push(
//           `Colour: ${item.color}`
//         );

//         lines.push(
//           `Quantity: ${item.quantity}`
//         );

//         lines.push(
//           `Price: ₦${(
//             Number(item.price) *
//             Number(
//               item.quantity
//             )
//           ).toLocaleString()}`
//         );

//         lines.push("");
//       }
//     );

//     lines.push(
//       `TOTAL: ₦${total.toLocaleString()}`
//     );

//     lines.push("");

//     lines.push(
//       "Please confirm my order. 🧡"
//     );

//     const message =
//       encodeURIComponent(
//         lines.join("\n")
//       );

//     window.open(
//       `https://wa.me/${whatsapp}?text=${message}`,
//       "_blank"
//     );
//   }

//   return (
//     <main className="min-h-screen bg-[#FFF9F4]">

//       <Navbar />

//       <div className="mx-auto max-w-5xl px-5 py-12">

//         <Link
//           href="/shop"
//           className="flex items-center gap-2 text-sm font-bold text-black/40"
//         >
//           <ArrowLeft size={15} />
//           Continue shopping
//         </Link>

//         <h1 className="mt-8 text-5xl font-black text-[#2A211C]">
//           Your steps.
//         </h1>

//         {!cart.length ? (

//           <div className="mt-10 rounded-[2rem] bg-white p-16 text-center">

//             <div className="text-6xl">
//               🛍️
//             </div>

//             <h2 className="mt-5 text-2xl font-black">
//               Your bag is empty.
//             </h2>

//             <p className="mt-2 text-black/40">
//               Something cute belongs
//               in here.
//             </p>

//             <Link
//               href="/shop"
//               className="mt-7 inline-block rounded-full bg-[#F4A261] px-7 py-4 font-black"
//             >
//               Start shopping
//             </Link>

//           </div>

//         ) : (

//           <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_350px]">

//             <div className="space-y-4">

//               {cart.map(
//                 (item) => (

//                   <div
//                     key={
//                       item.cartId
//                     }
//                     className="flex gap-4 rounded-[2rem] bg-white p-4"
//                   >

//                     <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#F3EEE7]">

//                       {item.image && (
//                         <img
//                           src={
//                             item.image
//                           }
//                           alt={
//                             item.name
//                           }
//                           className="h-full w-full object-cover"
//                         />
//                       )}

//                     </div>

//                     <div className="min-w-0 flex-1">

//                       <div className="flex justify-between gap-3">

//                         <div>

//                           <h3 className="font-black">
//                             {item.name}
//                           </h3>

//                           <p className="mt-1 text-xs text-black/40">
//                             Size{" "}
//                             {item.size}
//                             {" • "}
//                             {item.color}
//                           </p>

//                         </div>

//                         <button
//                           onClick={() =>
//                             removeFromCart(
//                               item.cartId
//                             )
//                           }
//                           className="text-black/30 hover:text-red-500"
//                         >
//                           <Trash2
//                             size={16}
//                           />
//                         </button>

//                       </div>

//                       <div className="mt-6 flex items-center justify-between">

//                         <div className="flex items-center rounded-full border border-black/10">

//                           <button
//                             onClick={() =>
//                               updateQuantity(
//                                 item.cartId,
//                                 item.quantity -
//                                   1
//                               )
//                             }
//                             className="p-2"
//                           >
//                             <Minus
//                               size={13}
//                             />
//                           </button>

//                           <span className="w-7 text-center text-xs font-black">
//                             {
//                               item.quantity
//                             }
//                           </span>

//                           <button
//                             onClick={() =>
//                               updateQuantity(
//                                 item.cartId,
//                                 item.quantity +
//                                   1
//                               )
//                             }
//                             className="p-2"
//                           >
//                             <Plus
//                               size={13}
//                             />
//                           </button>

//                         </div>

//                         <p className="font-black text-[#C9683F]">
//                           ₦
//                           {(
//                             Number(
//                               item.price
//                             ) *
//                             Number(
//                               item.quantity
//                             )
//                           ).toLocaleString()}
//                         </p>

//                       </div>

//                     </div>

//                   </div>

//                 )
//               )}

//             </div>


//             {/* SUMMARY */}

//             <aside className="h-fit rounded-[2rem] bg-[#2A211C] p-7 text-white">

//               <p className="text-xs font-black uppercase tracking-wider text-white/30">
//                 Order summary
//               </p>

//               <div className="mt-6 flex justify-between">

//                 <span className="text-white/40">
//                   Items
//                 </span>

//                 <span className="font-bold">
//                   {cart.reduce(
//                     (sum, item) =>
//                       sum +
//                       Number(
//                         item.quantity
//                       ),
//                     0
//                   )}
//                 </span>

//               </div>

//               <div className="mt-5 flex justify-between border-t border-white/10 pt-5">

//                 <span className="font-black">
//                   Total
//                 </span>

//                 <span className="text-2xl font-black text-[#F4A261]">
//                   ₦
//                   {total.toLocaleString()}
//                 </span>

//               </div>

//               <button
//                 onClick={
//                   checkout
//                 }
//                 className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#F4A261] px-5 py-4 font-black text-[#2A211C]"
//               >

//                 <MessageCircle
//                   size={18}
//                 />

//                 Checkout on WhatsApp

//               </button>

//               <p className="mt-4 text-center text-xs leading-5 text-white/30">
//                 You'll confirm your
//                 order and delivery
//                 details with Every Step
//                 on WhatsApp.
//               </p>

//             </aside>

//           </div>

//         )}

//       </div>

//     </main>
//   );
// }

"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageCircle, Minus, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../component/CartProvider";

const WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", location: "", note: "" });

  function openCheckout() {
    if (!items.length) return;
    if (!WA) {
      alert("WhatsApp checkout is not configured yet. Add NEXT_PUBLIC_WHATSAPP_NUMBER to .env.local.");
      return;
    }
    setCheckoutOpen(true);
  }

  function checkout(e) {
    e.preventDefault();
    if (!items.length || !WA) return;

    const lines = [
      "Hi Every Step! 🧡",
      "",
      "I'd like to place an order:",
      "",
      ...items.map((item, i) =>
        `${i + 1}. ${item.name}\nSize: ${item.size}\nColour: ${item.color}\nQuantity: ${item.quantity}\nPrice: ₦${(item.price * item.quantity).toLocaleString()}\nDesign image: ${item.image}`
      ),
      "",
      `TOTAL: ₦${total.toLocaleString()}`,
      "",
      `Name: ${customer.name}`,
      `Phone: ${customer.phone}`,
      `Delivery location: ${customer.location}`,
      customer.note ? `Note: ${customer.note}` : "",
      "",
      "Please confirm my order and delivery details. Thank you! 🧡",
    ].filter(Boolean);

    window.open(`https://wa.me/${WA.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="shell py-10 sm:py-16">
      <Link href="/shop" className="text-sm font-black"><ArrowLeft className="mr-2 inline" size={16}/> Continue shopping</Link>

      <div className="mt-8 grid p-12 gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.25em] text-[#d97745]">Your little collection</p>
              <h1 className="mt-2 text-4xl font-black">Your steps 🧡</h1>
            </div>
            {items.length > 0 && <button onClick={clearCart} className="text-xs font-black text-black/40 hover:text-red-500">Clear bag</button>}
          </div>

          {!items.length ? (
            <div className="mt-8 rounded-[2rem] bg-white p-12 text-center shadow-sm">
              <div className="text-6xl">🛍️</div>
              <h2 className="mt-4 text-xl font-black">Your bag is empty.</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-black/45">Go find a pair, play with the colours, choose your size, and bring your favourite design home.</p>
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
          <button onClick={openCheckout} disabled={!items.length} className="mt-7 w-full rounded-full bg-[#f4a261] px-5 py-4 font-black text-[#2a211c] disabled:opacity-30"><MessageCircle className="mr-2 inline" size={17}/> Proceed to WhatsApp</button>
          <p className="mt-4 text-center text-xs leading-5 text-white/35">No online payment. We'll confirm your order, delivery and payment details with you on WhatsApp.</p>
        </aside>
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#2a211c]/70 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 max-w-lg rounded-[2rem] bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#d97745]">Almost there</p><h2 className="mt-2 text-3xl font-black">Where should we send it?</h2><p className="mt-2 text-sm text-black/45">We'll put these details into your WhatsApp order.</p></div>
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

              <button type="submit" className="w-full rounded-full bg-[#f4a261] py-4 font-black text-[#2a211c]"><MessageCircle className="mr-2 inline" size={17}/> Send order to WhatsApp</button> 
            </form>
          </div>
        </div>
      )}
    </main>
  );
}