import { NextResponse } from 'next/server';
import { currentRewardsCustomer } from '@/lib/es-rewards-server';
import { sameOrigin } from '@/lib/es-payment-security';
import { randomUUID } from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const bad=(error,status=400)=>NextResponse.json({error},{status});
const validId=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(id);
export async function GET(request){
 const url=new URL(request.url);
 const mode=url.searchParams.get('mode');
 try{
  const {admin,customer,registered}=await currentRewardsCustomer();
  if(mode==='eligible'){
   if(!registered)return bad('Sign in to see your reviews',401);
   const {data:orders,error:oe}=await admin.from('es_orders').select('id,order_number,status,production_status').eq('customer_id',customer.id).limit(100);
   if(oe)throw oe;
   const delivered=(orders||[]).filter(o=>o.status==='fulfilled'||o.production_status==='delivered');
   if(!delivered.length)return NextResponse.json({eligible:[]});
   const ids=delivered.map(o=>o.id);
   const [{data:items,error:ie},{data:existing,error:re}]=await Promise.all([
    admin.from('es_order_items').select('order_id,product_id').in('order_id',ids),
    admin.from('es_product_reviews').select('order_id,product_id').in('order_id',ids)
   ]);
   if(ie||re)throw ie||re;
   const reviewed=new Set((existing||[]).map(r=>r.order_id+':'+r.product_id));
   const productIds=[...new Set((items||[]).map(i=>i.product_id).filter(Boolean))];
   const {data:products,error:pe}=productIds.length?await admin.from('products').select('id,name').in('id',productIds):{data:[],error:null};
   if(pe)throw pe;
   const names=new Map((products||[]).map(x=>[x.id,x.name]));
   const byId=new Map(delivered.map(o=>[o.id,o]));
   return NextResponse.json({eligible:(items||[]).filter(i=>i.product_id&&!reviewed.has(i.order_id+':'+i.product_id)).map(i=>({orderId:i.order_id,orderNumber:byId.get(i.order_id)?.order_number,productId:i.product_id,productName:names.get(i.product_id)||'Footwear'}))},{headers:{'Cache-Control':'private, no-store'}});
  }
  const productId=url.searchParams.get('productId');
  if(productId&&!validId(productId))return bad('Invalid product',400);
  let query=admin.from('es_product_reviews').select('id,product_id,rating,review,photo_path,created_at').order('created_at',{ascending:false}).limit(100);
  if(productId)query=query.eq('product_id',productId);
  const {data,error}=await query;
  if(error)throw error;
  const productIds=[...new Set((data||[]).map(r=>r.product_id))];
  const {data:products,error:pe}=productIds.length?await admin.from('products').select('id,name').in('id',productIds):{data:[],error:null};
  if(pe)throw pe;
  const names=new Map((products||[]).map(p=>[p.id,p.name]));
  const reviews=(data||[]).map(r=>({id:r.id,productId:r.product_id,productName:names.get(r.product_id)||'Every Step footwear',rating:r.rating,review:r.review,createdAt:r.created_at,photoUrl:r.photo_path?admin.storage.from('es-review-photos').getPublicUrl(r.photo_path).data.publicUrl:null}));
  return NextResponse.json({reviews,average:reviews.length?reviews.reduce((n,r)=>n+r.rating,0)/reviews.length:0},{headers:{'Cache-Control':'public, max-age=0, must-revalidate'}});
 }catch(e){console.error('Review listing',e);return bad('Unable to load reviews',500)}
}
export async function POST(request){
 if(!sameOrigin(request))return bad('Invalid request origin',403);
 const length=Number(request.headers.get('content-length')||0);
 if(length>3500000)return bad('Review upload exceeds 3 MB',413);
 try{
  const {admin,customer,registered}=await currentRewardsCustomer();
  if(!registered)return bad('Sign in to review your purchase',401);
  const form=await request.formData();
  const productId=form.get('productId'),orderId=form.get('orderId');
  const rating=Number(form.get('rating'));const review=String(form.get('review')||'').trim();
  if(!validId(productId)||!validId(orderId)||!Number.isInteger(rating)||rating<1||rating>5||review.length<10||review.length>1200)return bad('Check your review details');
  const {data:order,error:oe}=await admin.from('es_orders').select('id,status,production_status').eq('id',orderId).eq('customer_id',customer.id).maybeSingle();
  if(oe)throw oe;
  if(!order||(order.status!=='fulfilled'&&order.production_status!=='delivered'))return bad('Only delivered purchases can be reviewed',403);
  const {data:item,error:ie}=await admin.from('es_order_items').select('product_id').eq('order_id',orderId).eq('product_id',productId).limit(1).maybeSingle();
  if(ie)throw ie;if(!item)return bad('This footwear was not in your order',403);
  const {data:existing,error:ee}=await admin.from('es_product_reviews').select('id').eq('order_id',orderId).eq('product_id',productId).maybeSingle();
  if(ee)throw ee;if(existing)return bad('You have already reviewed this purchase',409);
  const photo=form.get('photo');let path=null;
  if(photo&&typeof photo==='object'&&typeof photo.arrayBuffer==='function'&&photo.size){
   if(photo.size>3000000)return bad('Photo must be under 3 MB');
   const bytes=Buffer.from(await photo.arrayBuffer());
   const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
   const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
   const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
   const mime=jpeg?'image/jpeg':png?'image/png':webp?'image/webp':null;
   if(!mime)return bad('Upload a JPEG, PNG or WebP photo');
   path=`${customer.id}/${randomUUID()}.${jpeg?'jpg':png?'png':'webp'}`;
   const {error:uploadError}=await admin.storage.from('es-review-photos').upload(path,bytes,{contentType:mime,upsert:false});
   if(uploadError)throw uploadError;
  }
  const {error}=await admin.from('es_product_reviews').insert({product_id:productId,customer_id:customer.id,order_id:orderId,rating,review,photo_path:path});
  if(error){if(path)await admin.storage.from('es-review-photos').remove([path]);if(error.code==='23505')return bad('You have already reviewed this purchase',409);throw error;}
  return NextResponse.json({success:true});
 }catch(e){console.error('Review submission',e);return bad('Unable to submit review',500)}
}
