import Link from 'next/link';
import Navbar from '@/component/Navbar';
import {createClient} from '@/lib/supabase/server';
export const revalidate=60;
const looks=[
 {title:'Everyday Ease',icon:'☀️',words:'Relaxed denim, linen shirts, simple dresses and easy-to-wear slides.',terms:['slide','sandal','flat']},
 {title:'Workday Chic',icon:'💼',words:'Tailored trousers, structured skirts, neat shirts and understated footwear.',terms:['loafer','flat','mule','office']},
 {title:'Date Night',icon:'🌙',words:'A flowing dress, coordinated accessories and a statement pair.',terms:['heel','mule','strap']},
 {title:'Celebration Ready',icon:'✨',words:'Traditional outfits, occasion wear and an elegant finishing touch.',terms:['dress','heel','sandal']},
];
export default async function StyleMySteps(){
 const db=await createClient();const {data:products}=await db.from('products').select('id,name,slug,images,category,description').eq('is_active',true).limit(100);
 const all=products||[];
 return <main className="min-h-screen bg-[#fff9f4] text-[#2a211c]"><Navbar/><div className="mx-auto max-w-6xl px-5 pb-20 pt-24"><p className="text-sm font-black uppercase tracking-widest text-[#c9683f]">Every Step style edit</p><h1 className="mt-3 text-5xl font-black">Style My Steps 🧡</h1><p className="mt-4 max-w-2xl text-black/60">Choose a mood and find your next favourite pair. Step Style was selected automatically by AI, make sure to check appropraitely before making final decision.</p><div className="mt-10 grid gap-6 md:grid-cols-2">{looks.map(look=>{const matching=all.filter(p=>look.terms.some(t=>`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(t)));const picks=(matching.length?matching:all).slice(0,3);return <section key={look.title} className="rounded-[2rem] bg-white p-6 shadow-sm"><div className="text-4xl">{look.icon}</div><h2 className="mt-3 text-2xl font-black">{look.title}</h2><p className="mt-2 text-sm text-black/60">{look.words}</p><div className="mt-5 grid grid-cols-3 gap-3">{picks.map(p=><Link href={`/product/${p.slug}`} key={p.id} className="group"><div className="aspect-square overflow-hidden rounded-xl bg-[#f4e9df]">{p.images?.[0]&&<img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105"/>}</div><p className="mt-2 text-xs font-bold">{p.name}</p></Link>)}</div><Link href="/shop" className="mt-5 inline-block rounded-full bg-[#f4a261] px-5 py-3 text-sm font-black">Explore the collection →</Link></section>})}</div></div></main>
}