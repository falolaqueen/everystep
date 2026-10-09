"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Coins, Sparkles, LogOut, UserRound, ArrowLeft } from "lucide-react";
import { useCart } from "@/component/CartProvider";
import ProfileReviews from "@/component/ProfileReviews";
export default function ProfilePage() {
  const router = useRouter();
  const { items } = useCart();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState({ orders: [], coins: null, aiPasses: null });
  const [ordersError, setOrdersError] = useState("");
  const [pendingReviews, setPendingReviews] = useState([]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const r = await fetch("/api/account/order-history", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Could not load orders");
        if (active) { setOrderData(j); setOrdersError(""); }
        const reviewResponse = await fetch("/api/reviews?mode=eligible", { cache: "no-store" });
        if (reviewResponse.ok) {
          const reviewJson = await reviewResponse.json();
          if (active) setPendingReviews(reviewJson.eligible || []);
        }
      } catch (e) { if (active) setOrdersError(e.message); }
    };
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(refresh, 30000);
    return () => { active = false; window.removeEventListener("focus", onFocus); window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data?.user) router.replace("/account?next=%2Fprofile");
      else setUser(data.user);
      setLoading(false);
    }).catch(() => { if (active) { setError("Unable to check your account."); setLoading(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user && active) router.replace("/account?next=%2Fprofile");
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router]);

  async function logout() {
    setBusy(true);
    const { error: authError } = await createClient().auth.signOut();
    if (authError) { setError(authError.message); setBusy(false); return; }
    router.replace("/account");
    router.refresh();
  }

  if (loading) return <main className="min-h-screen bg-[#FFF9F3] p-10 text-center">Loading your profile…</main>;
  if (!user) return <main className="min-h-screen bg-[#FFF9F3] p-10 text-center">{error || "Redirecting to sign in…"}</main>;

  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Customer";
  const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <main className="min-h-screen bg-[#FFF9F3] px-4 pb-16 pt-28 text-[#2A211C]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#8C6C57]"><ArrowLeft size={16}/> Home</Link>
        <div className="rounded-[2rem] bg-[#2A211C] p-7 text-white sm:p-10">
          <div className="flex items-center gap-4"><div className="rounded-full bg-[#F4A261] p-4 text-[#2A211C]"><UserRound size={26}/></div><div><p className="text-sm text-[#F4A261]">Your Every Step profile</p><h1 className="text-2xl font-black sm:text-3xl">Welcome, {name}!</h1><p className="mt-1 break-all text-sm text-white/70">{user.email}</p></div></div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm"><Sparkles className="text-[#D97842]"/><h2 className="mt-4 font-bold">AI Credits</h2><p className="mt-2 text-sm text-[#806A5C]">{orderData.aiPasses === null ? "Loading…" : orderData.isAdmin ? "Unlimited" : `${orderData.aiPasses} available`}</p></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm"><Coins className="text-[#D97842]"/><h2 className="mt-4 font-bold">Step Coins</h2><p className="mt-2 text-sm text-[#806A5C]">{orderData.coins === null ? "Loading…" : `${Number(orderData.coins).toLocaleString("en-NG")} coins`}</p></div>
          <Link href="/cart" className="rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-md"><ShoppingBag className="text-[#D97842]"/><h2 className="mt-4 font-bold">My Cart</h2><p className="mt-2 text-sm text-[#806A5C]">{count} {count === 1 ? "item" : "items"} · View cart →</p></Link>
        </div>
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm" aria-label="My orders">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">My orders & updates</h2><span className="text-sm text-[#806A5C]">{orderData.orders.length} orders</span></div>
          <p className="mt-1 text-sm text-[#806A5C]">Updates from our studio appear here automatically.</p>
          {ordersError && <p role="alert" className="mt-3 text-sm text-red-600">{ordersError}</p>}
          {orderData.orders.length === 0 && !ordersError && <p className="mt-5 text-sm text-[#806A5C]">No orders yet. Your orders will appear here after checkout.</p>}
          <div className="mt-4 space-y-3">{orderData.orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-[#E9E0D8] p-4 transition hover:border-[#F4A261] hover:bg-[#FFF9F3]">
              <div className="flex flex-wrap items-center justify-between gap-2"><strong>{order.orderNumber}</strong><span className="text-sm font-bold text-[#B16B3C]">₦{Number(order.amount || 0).toLocaleString("en-NG")}</span></div>
              <p className="mt-2 text-sm">Payment: {String(order.paymentStatus || "pending").replaceAll("_", " ")} · Shoes: {String(order.productionStatus || "not_started").replaceAll("_", " ")}</p>
              {order.latestUpdate && <p className="mt-2 text-sm text-[#806A5C]">Latest: {order.latestUpdate.note || String(order.latestUpdate.status).replaceAll("_", " ")}</p>}
              {order.estimatedDate && <p className="mt-1 text-xs text-[#806A5C]">Estimated delivery: {order.estimatedDate}</p>}
              <Link href={`/account/orders/${order.id}`} className="mt-2 inline-block text-xs font-bold text-[#B16B3C] underline">View progress & updates →</Link>
              {order.delivered && pendingReviews.some(r => r.orderId === order.id) && (
                <div className="mt-3"><Link href={`/profile#review-${order.id}`} className="inline-flex rounded-full bg-[#F4A261] px-4 py-2 text-sm font-bold text-[#2A211C]">Pending Review · Write a Review →</Link></div>
              )}
            </div>
          ))}</div>
        </section>
        <ProfileReviews />
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/shop" className="rounded-full bg-[#F4A261] px-6 py-3 font-bold">Continue shopping</Link><button type="button" onClick={logout} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-[#D97842] px-6 py-3 font-bold text-[#A65D2D] disabled:opacity-50"><LogOut size={17}/>{busy ? "Signing out…" : "Log out"}</button></div>
        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
      </div>
    </main>
  );
}