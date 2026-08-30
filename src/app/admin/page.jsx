// import { redirect } from "next/navigation";

// import {
//   Package,
//   ShoppingBag,
//   Plus,
//   LogOut,
// } from "lucide-react";

// import Link from "next/link";

// import { createClient } from "../../lib/supabase/server";

// export const dynamic =
//   "force-dynamic";

// export default async function AdminPage() {
//   const supabase =
//     await createClient();

//   const {
//     data: {
//       user,
//     },
//   } =
//     await supabase.auth.getUser();

//   if (!user) {
//     redirect(
//       "/admin/login"
//     );
//   }

//   const {
//     data: admin,
//   } =
//     await supabase
//       .from("admin_users")
//       .select("user_id")
//       .eq(
//         "user_id",
//         user.id
//       )
//       .single();

//   if (!admin) {
//     redirect(
//       "/admin/login"
//     );
//   }

//   const {
//     count: productCount,
//   } =
//     await supabase
//       .from("products")
//       .select(
//         "*",
//         {
//           count: "exact",
//           head: true,
//         }
//       );

//   const {
//     count: orderCount,
//   } =
//     await supabase
//       .from("orders")
//       .select(
//         "*",
//         {
//           count: "exact",
//           head: true,
//         }
//       );

//   return (
//     <main className="min-h-screen bg-[#FFF9F4]">

//       <header className="border-b border-black/5 bg-white">

//         <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">

//           <Link
//             href="/"
//             className="text-2xl font-black"
//           >
//             Every
//             <span className="text-[#E8895B]">
//               Step
//             </span>
//           </Link>

//           <form
//             action="/api/admin/logout"
//             method="POST"
//           >
//             <button className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-bold">
//               <LogOut
//                 size={14}
//               />
//               Log out
//             </button>
//           </form>

//         </div>

//       </header>


//       <section className="mx-auto max-w-7xl px-5 py-12">

//         <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9683F]">
//           Admin
//         </p>

//         <h1 className="mt-2 text-5xl font-black text-[#2A211C]">
//           Your store.
//         </h1>

//         <p className="mt-3 text-black/40">
//           Manage your Every Step
//           collection from here.
//         </p>


//         {/* STATS */}

//         <div className="mt-10 grid gap-4 sm:grid-cols-2">

//           <div className="rounded-[2rem] bg-white p-7">

//             <Package
//               className="text-[#E8895B]"
//             />

//             <p className="mt-6 text-4xl font-black">
//               {productCount ||
//                 0}
//             </p>

//             <p className="mt-1 text-sm text-black/40">
//               Products
//             </p>

//           </div>

//           <div className="rounded-[2rem] bg-[#2A211C] p-7 text-white">

//             <ShoppingBag
//               className="text-[#F4A261]"
//             />

//             <p className="mt-6 text-4xl font-black">
//               {orderCount ||
//                 0}
//             </p>

//             <p className="mt-1 text-sm text-white/40">
//               Orders
//             </p>

//           </div>

//         </div>


//         {/* ACTIONS */}

//         <div className="mt-10 grid gap-4 sm:grid-cols-2">

//           <Link
//             href="/admin/products"
//             className="group rounded-[2rem] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
//           >

//             <Package />

//             <h2 className="mt-5 text-xl font-black">
//               Manage products
//             </h2>

//             <p className="mt-2 text-sm leading-6 text-black/40">
//               Upload, edit and manage
//               your footwear collection.
//             </p>

//           </Link>

//           <Link
//             href="/admin/products/new"
//             className="rounded-[2rem] bg-[#F4A261] p-7 transition hover:-translate-y-1"
//           >

//             <Plus />

//             <h2 className="mt-5 text-xl font-black">
//               Add footwear
//             </h2>

//             <p className="mt-2 text-sm leading-6 text-[#2A211C]/50">
//               Upload a new product
//               directly from your browser.
//             </p>

//           </Link>

//         </div>

//       </section>

//     </main>
//   );
// }

 "use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { ImagePlus, LogOut, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [user,setUser]=useState(null);
  const [products,setProducts]=useState([]);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:"",description:"",price:"",category:"Slides",sizes:"36,37,38,39,40,41,42",is_new:false,is_featured:false,is_bestseller:false,allow_custom_colors:true,is_active:true,stock:"",images:[]});

  useEffect(()=>{load();},[]);

  async function load() {
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){router.replace("/admin/login");return;}
    const {data:admin}=await supabase.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
    if(!admin){await supabase.auth.signOut();router.replace("/admin/login");return;}
    setUser(user);
    const {data}=await supabase.from("products").select("*").order("created_at",{ascending:false});
    setProducts(data||[]);
    setLoading(false);
  }

  function edit(product) {
    setEditing(product);
    setForm({
      ...product,
      sizes:(product.sizes||[]).join(","),
      images:product.images||[],
      stock: product.stock ?? "",
      is_active: product.is_active !== false
    });
    setOpen(true);
  }

  function newProduct() {
    setEditing(null);
    setForm({name:"",description:"",price:"",category:"Slides",sizes:"36,37,38,39,40,41,42",is_new:false,is_featured:false,is_bestseller:false,allow_custom_colors:true,is_active:true,stock:"",images:[]});
    setOpen(true);
  }

  async function upload(e) {
    const files=[...e.target.files];
    const urls=[];
    for(const file of files) {
      const path=`products/${crypto.randomUUID()}-${file.name.replace(/\s+/g,"-")}`;
      const {error}=await supabase.storage.from("product-images").upload(path,file,{upsert:false});
      if(error){alert(error.message);continue;}
      const {data}=supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setForm(f=>({...f,images:[...(f.images||[]),...urls]}));
  }

  async function save(e) {
    e.preventDefault(); setSaving(true);
    const payload={
      name:form.name.trim(),
      slug:(form.name||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")+"-"+Date.now(),
      description:form.description,
      price:Number(form.price),
      category:form.category,
      images:form.images||[],
      sizes:form.sizes.split(",").map(x=>x.trim()).filter(Boolean),
      allow_custom_colors:!!form.allow_custom_colors,
      is_new:!!form.is_new,
      is_featured:!!form.is_featured,
      is_bestseller:!!form.is_bestseller,
      is_active: form.is_active !== false,
      stock: form.stock === "" ? null : Number(form.stock)
    };
    let result;
    if(editing) {
      delete payload.slug;
      result=await supabase.from("products").update(payload).eq("id",editing.id);
    } else result=await supabase.from("products").insert(payload);
    if(result.error) alert(result.error.message);
    else {setOpen(false);load();}
    setSaving(false);
  }

  async function remove(product) {
    if(!confirm(`Delete ${product.name}?`)) return;
    const {error}=await supabase.from("products").delete().eq("id",product.id);
    if(error) alert(error.message); else load();
  }

  async function logout() { await supabase.auth.signOut(); router.replace("/admin/login"); }

  if(loading) return <main className="min-h-screen bg-[#fff8f1] p-10">Loading your studio...</main>;

  return (
    <main className="min-h-screen bg-[#fff8f1]">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#d97745]">Every Step</p><h1 className="text-xl font-black">Studio</h1></div>
          <button onClick={logout} className="rounded-full border border-black/10 px-4 py-2 text-xs font-black"><LogOut className="mr-2 inline" size={14}/> Sign out</button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm text-black/45">Hello, Queen</p><h2 className="mt-1 text-4xl font-black">Your footwear.</h2></div>
          <button onClick={newProduct} className="rounded-full bg-[#f4a261] px-5 py-3 font-black"><Plus className="mr-2 inline" size={17}/> Add footwear</button>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p=>(
            <div key={p.id} className="overflow-hidden rounded-[2rem] bg-white">
              <div className="aspect-square bg-[#f1ece6]">{p.images?.[0] && <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover"/>}</div>
              <div className="p-5">
                <div className="flex justify-between gap-3"><h3 className="font-black">{p.name}</h3><b>₦{Number(p.price).toLocaleString()}</b></div>
                <p className="mt-1 text-xs text-black/40">{p.category} · sizes {(p.sizes||[]).join(", ")}</p><p className="mt-1 text-xs font-bold text-black/40">{p.is_active ? "Live in store" : "Hidden from store"}{p.stock !== null && p.stock !== undefined ? ` · ${p.stock} in stock` : ""}</p>
                <div className="mt-4 flex gap-2"><button onClick={()=>edit(p)} className="flex-1 rounded-full bg-[#f7f2ed] py-2 text-xs font-black">Edit</button><button onClick={()=>remove(p)} className="rounded-full bg-red-50 px-4 py-2 text-red-600"><Trash2 size={15}/></button></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#2a211c]/70 p-4 backdrop-blur">
          <form onSubmit={save} className="mx-auto my-8 max-w-2xl rounded-[2rem] bg-white p-7">
            <div className="flex items-center justify-between"><h2 className="text-2xl font-black">{editing ? "Edit footwear" : "Add footwear"}</h2><button type="button" onClick={()=>setOpen(false)}><X/></button></div>
            <label className="mt-6 block text-xs font-black uppercase text-black/40">Product photos</label>
            <label className="mt-2 flex min-h-40 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-black/10 bg-[#fff8f1]">
              <div className="text-center"><ImagePlus className="mx-auto text-[#d97745]"/><p className="mt-2 text-sm font-black">Upload photos</p><p className="text-xs text-black/35">PNG, JPG or WEBP</p></div>
              <input type="file" accept="image/*" multiple onChange={upload} className="hidden"/>
            </label>
            {!!form.images?.length && <div className="mt-3 grid grid-cols-4 gap-2">{form.images.map((url,i)=><div key={url} className="relative"><img src={url} alt="" className="aspect-square rounded-xl object-cover"/><button type="button" onClick={()=>setForm(f=>({...f,images:f.images.filter((_,n)=>n!==i)}))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X size={12}/></button></div>)}</div>}

            <input required placeholder="Product name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-6 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"/>
            <textarea placeholder="Description" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} className="mt-3 min-h-28 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"/>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input required type="number" placeholder="Price (₦)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"/>
              <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"/>
            </div>
            <input type="number" min="0" placeholder="Stock (optional)" value={form.stock ?? ""} onChange={e=>setForm({...form,stock:e.target.value})} className="mt-3 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"/>
            <input placeholder="Sizes e.g. 36,37,38,39,40" value={form.sizes} onChange={e=>setForm({...form,sizes:e.target.value})} className="mt-3 w-full rounded-2xl bg-[#f7f2ed] px-4 py-4 outline-none"/>
            <div className="mt-5 space-y-3 text-sm font-bold">
              {[
                ["allow_custom_colors","Allow AI colour customization"],
                ["is_new","Mark as new"],
                ["is_featured","Featured product"],
                ["is_bestseller","Bestseller"],
                ["is_active","Visible in shop"]
              ].map(([key,label])=><label key={key} className="flex items-center gap-3"><input type="checkbox" checked={!!form[key]} onChange={e=>setForm({...form,[key]:e.target.checked})}/>{label}</label>)}
            </div>
            <button disabled={saving} className="mt-7 w-full rounded-full bg-[#f4a261] py-4 font-black disabled:opacity-50">{saving ? "Publishing..." : editing ? "Save changes" : "Publish footwear"}</button>
          </form>
        </div>
      )}
    </main>
  );
}
