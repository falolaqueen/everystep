'use client';
import {useState} from 'react';
export default function SizeGuide({availableSizes=[]}){
 const [open,setOpen]=useState(false),[length,setLength]=useState('');
 const cm=Number(length);const valid=length!==''&&Number.isFinite(cm)&&cm>0;
 return <div className="my-5 rounded-3xl border border-[#f1d5c0] bg-[#fff9f4] p-5 text-[#2a211c]">
  <button type="button" className="flex w-full items-center justify-between font-black" onClick={()=>setOpen(v=>!v)}>📏 Find your fit — Size Guide <span>{open?'−':'+'}</span></button>
  {open&&<div className="mt-4 space-y-4 text-sm"><p>Stand on paper, mark the back of your heel and tip of your longest toe, then measure the distance in centimetres. Measure both feet and use the longer measurement.</p>
   <label className="block font-semibold">Foot length (cm)<input type="number" min="10" max="40" step="0.1" value={length} onChange={e=>setLength(e.target.value)} placeholder="e.g. 24.5" className="mt-2 w-full rounded-xl border border-[#e9c5a9] bg-white p-3"/></label>
   {valid&&<p className="rounded-xl bg-white p-3">Your foot measures <strong>{cm.toFixed(1)} cm</strong>. Compare it with our footwear measurements before choosing a size.</p>}
   <p className="font-semibold">Available sizes: {Array.isArray(availableSizes)?availableSizes.join(', '):String(availableSizes||'Ask us for available sizes')}</p>
   <p className="text-xs text-[#805f4e]">Footwear sizing differs by last and design. This is a measurement guide, not an automatic size recommendation. Confirm the corresponding centimetre measurements with Every Step before purchasing.</p>
  </div>}
 </div>;
}
