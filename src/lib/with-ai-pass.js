import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { currentRewardsCustomer } from "@/lib/es-rewards-server";

export function withAiPass(existingPost) {
  return async function POST(request) {
    let admin;
    let requestId;
    let reserved = false;
    try {
      const ctx = await currentRewardsCustomer();
      admin = ctx.admin;

      // Admin privileges are determined on the server by authenticated user ID.
      // Never trust a client-provided email, flag, or request header.
      if (ctx.registered && ctx.customer.auth_user_id) {
        const { data: adminRow, error: adminError } = await admin
          .from("admin_users")
          .select("user_id")
          .eq("user_id", ctx.customer.auth_user_id)
          .maybeSingle();
        if (adminError) throw adminError;
        if (adminRow) {
          // Unlimited site passes, but OpenAI API calls are still billable.
          return await existingPost(request);
        }
      }

      requestId = crypto.randomUUID();
      const { data: allowed, error } = await admin.rpc("es_reserve_ai_pass", {
        p_customer: ctx.customer.id, p_request: requestId,
      });
      if (error) throw error;
      if (!allowed) {
        return NextResponse.json({
          error: "No AI credits remaining. New customers start with 3 AI credits. Each fulfilled order adds 1 more AI credit.",
          code: "AI_PASSES_EXHAUSTED",
        }, { status: 429 });
      }
      reserved = true;
      let response;
      try {
        response = await existingPost(request);
      } catch (error) {
        console.error("AI handler failed", error);
        response = NextResponse.json({ error: "AI generation failed." }, { status: 500 });
      }
      let success = false;

if (response instanceof Response && response.ok) {
  try {
    const payload = await response.clone().json();

    success =
      payload?.success === true &&
      typeof payload?.imageUrl === "string" &&
      payload.imageUrl.length > 0;
  } catch {
    success = false;
  }
}
      const { error: finishError } = await admin.rpc("es_finish_ai_pass", {
        p_request: requestId, p_success: success,
      });
      if (finishError) {
        console.error("AI pass finalization failed", finishError);
        return NextResponse.json({ error: "AI pass could not be finalized. Contact support before retrying." }, { status: 503 });
      }
      reserved = false;
      return response;
    } catch (error) {
      console.error("AI pass enforcement failed", error);
      if (reserved && admin && requestId) {
        const { error: refundError } = await admin.rpc("es_finish_ai_pass", {
          p_request: requestId, p_success: false,
        });
        if (refundError) console.error("AI pass refund failed", refundError);
      }
      return NextResponse.json({ error: "AI generation is temporarily unavailable." }, { status: 503 });
    }
  };
}