"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
const stages=["order_placed","payment_confirmed","in_production","quality_check","ready_for_dispatch","dispatched","delivered"];
const labels={order_placed:"Order placed",payment_confirmed:"Payment confirmed",in_production:"In production",quality_check:"Quality check",ready_for_dispatch:"Ready for dispatch",dispatched:"Out for delivery",delivered:"Delivered",cancelled:"Cancelled"};
export default function OrderTracking(){
 const {orderId}=useParams();const [data,setData]=useState(null);const [error,setError]=useState("");
 useEffect(() => {
  if (!orderId) return;
  let active = true;
  const refresh = async () => {
   try {
    const response = await fetch(`/api/orders/tracking?id=${encodeURIComponent(orderId)}`, {cache:"no-store"});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load order updates");
    if (active) {setData(result); setError("");}
   } catch (e) {if (active) setError(e.message || "Unable to load order updates");}
  };
  refresh();
  const timer = window.setInterval(refresh, 30000);
  window.addEventListener("focus", refresh);
  const onVisible = () => {if (document.visibilityState === "visible") refresh();};
  document.addEventListener("visibilitychange", onVisible);
  return () => {active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible);};
 }, [orderId]);
 const o=data?.order;const current=o?.productionStatus||"order_placed";const reached=stages.indexOf(current);
 return <main className="min-h-screen bg-[#fff8f1] px-4 py-12 text-[#2a211c]"><div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-7 shadow-sm"><Link href="/profile" className="text-sm font-bold text-[#d97745]">← My account</Link><p className="mt-6 text-xs font-black uppercase tracking-widest text-[#d97745]">Every Step journey 🧡</p><h1 className="mt-2 text-3xl font-black">Track your shoes</h1>{error&&<p role="alert" className="mt-5 text-red-600">{error}</p>}{!data&&!error&&<p className="mt-5">Loading your order…</p>}{o&&<><p className="mt-4 text-sm text-black/60">Order {o.orderNumber} · ₦{Number(o.amount).toLocaleString("en-NG")}</p><p className="mt-2 text-sm font-bold">Payment: {String(o.paymentStatus||"").replaceAll("_"," ")}</p>{o.estimatedDate&&<p className="mt-2 text-sm">Estimated delivery: {o.estimatedDate}</p>}{o.courier&&<p className="mt-2 text-sm">Courier: {o.courier}</p>}{o.tracking&&<p className="mt-2 text-sm">Tracking number: {o.tracking}</p>}{current==="cancelled"?<p className="mt-5 rounded-2xl bg-red-50 p-4 font-bold">This order was cancelled.</p>:<div className="mt-8 space-y-5">{stages.map((s,i)=><div key={s} className="flex items-start gap-4"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-black ${i<=reached?"bg-[#f4a261]":"bg-[#f7f2ed] text-black/30"}`}>{i<reached?"✓":i+1}</div><div><p className={`font-bold ${i>reached?"text-black/35":""}`}>{labels[s]}</p>{data.updates.filter(u=>u.status===s).map((u,i)=><div key={i} className="mt-1 text-sm text-black/60">{u.note&&<p>{u.note}</p>}<p className="text-xs">{new Date(u.created_at).toLocaleDateString("en-NG")}</p></div>)}</div></div>)}</div>}<p className="mt-8 text-xs text-black/50">Step Coins and bonus AI passes are awarded once your order is marked delivered, if eligible.</p></>}</div></main>
}