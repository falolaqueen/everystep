import { NextResponse } from "next/server";
import { customerOrder } from "@/lib/es-payment-security";
export const dynamic="force-dynamic";
export async function GET(request){
 const id=new URL(request.url).searchParams.get("id");
 if(!id||!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Invalid order"},{status:400});
 try{
  const {admin,order}=await customerOrder(id);
  if(!order)return NextResponse.json({error:"Order not found"},{status:404});
  const {data:updates,error}=await admin.from("es_order_updates").select("status,note,created_at").eq("order_id",id).order("created_at",{ascending:true});
  if(error)throw error;
  return NextResponse.json({order:{id:order.id,orderNumber:order.order_number,amount:order.amount_paid,paymentStatus:order.payment_status,productionStatus:order.production_status,estimatedDate:order.estimated_delivery_date,courier:order.courier_name,tracking:order.tracking_number,createdAt:order.created_at},updates},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Order tracking",e);return NextResponse.json({error:"Unable to load order"},{status:500})}
}
