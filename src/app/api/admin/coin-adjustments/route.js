import { NextResponse } from "next/server";
import { authorizedAdmin, sameOrigin } from "@/lib/es-payment-security";
export const runtime="nodejs";
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({error:"Invalid origin"},{status:403});
  try {
    const auth=await authorizedAdmin();
    if (!auth) return NextResponse.json({error:"Unauthorized"},{status:403});
    const body=await request.json();
    if (typeof body.customerId!=="string" || !/^[0-9a-f-]{36}$/i.test(body.customerId) || !Number.isSafeInteger(body.coins) || body.coins===0 || Math.abs(body.coins)>100000 || typeof body.reason!=="string" || body.reason.trim().length<5 || body.reason.length>500)
      return NextResponse.json({error:"Invalid customer, coins or reason"},{status:400});
    const {error}=await auth.admin.rpc("es_admin_adjust_coins",{p_customer:body.customerId,p_admin:auth.user.id,p_coins:body.coins,p_reason:body.reason.trim()});
    if(error) return NextResponse.json({error:error.message},{status:409});
    return NextResponse.json({success:true});
  } catch(error) { console.error("Coin adjustment",error); return NextResponse.json({error:"Unable to adjust coins"},{status:500}); }
}
