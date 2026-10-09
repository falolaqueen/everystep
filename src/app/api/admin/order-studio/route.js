import { NextResponse } from "next/server";
import { authorizedAdmin, sameOrigin } from "@/lib/es-payment-security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const bad=(error,status=400)=>NextResponse.json({error},{status});
export async function GET(){
 try{
  const a=await authorizedAdmin();if(!a)return bad("Unauthorized",403);
  const {admin}=a;
  const [{data:orders,error:e1},{data:customers,error:e2},{data:ledger,error:e3},{data:balances,error:e4},{data:updates,error:e5},{data:submissions,error:e6}]=await Promise.all([
   admin.from("es_orders").select("*").order("created_at",{ascending:false}).limit(500),
   admin.from("es_customers").select("id,email,phone,auth_user_id,created_at").limit(1000),
   admin.from("es_coin_ledger").select("customer_id,coins").limit(10000),
   admin.from("es_ai_balances").select("customer_id,available").limit(1000),
   admin.from("es_order_updates").select("id,order_id,status,note,created_at").order("created_at",{ascending:false}).limit(3000),
   admin.from("es_payment_submissions").select("id,order_id,receipt_path,transfer_reference,payment_status,created_at,admin_note").order("created_at",{ascending:false}).limit(1000)
  ]);
  const error=e1||e2||e3||e4||e5||e6;if(error)throw error;
  const orderIds=(orders||[]).map(o=>o.id);
  let items=[];
  if(orderIds.length){
   const {data:itemRows,error:itemError}=await admin.from("es_order_items")
    .select("order_id,product_id,product_name,image_url,size,color,quantity,unit_price")
    .in("order_id",orderIds).limit(2000);
   if(itemError)throw itemError;
   items=itemRows||[];
  }
  const coins=new Map();for(const l of ledger||[])coins.set(l.customer_id,(coins.get(l.customer_id)||0)+l.coins);
  const passes=new Map((balances||[]).map(b=>[b.customer_id,b.available]));
  const customerRows=(customers||[]).map(c=>({...c,coins:coins.get(c.id)||0,aiPasses:passes.get(c.id)??3}));
  return NextResponse.json({orders,items,customers:customerRows,updates,submissions},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Order studio GET",e);return bad("Unable to load order studio",500)}
}
export async function POST(request){
 if(!sameOrigin(request))return bad("Invalid origin",403);
 try{
  const a=await authorizedAdmin();if(!a)return bad("Unauthorized",403);
  const b=await request.json();
  if(b.action!=="update")return bad("Invalid action");
  if(typeof b.orderId!=="string"||typeof b.status!=="string")return bad("Invalid order");
  const {error}=await a.admin.rpc("es_admin_update_order",{
   p_order:b.orderId,p_admin:a.user.id,p_status:b.status,
   p_note:String(b.note||"").slice(0,1000),p_estimated_date:b.estimatedDate||null,
   p_courier:String(b.courier||"").slice(0,120),p_tracking:String(b.tracking||"").slice(0,160)
  });
  if(error)return bad(error.message,409);
  return NextResponse.json({success:true});
 }catch(e){console.error("Order studio POST",e);return bad("Unable to update order",500)}
}
