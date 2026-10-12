import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/lib/supabase/server";
import { currentRewardsCustomer, rewardsAdmin } from "@/lib/es-rewards-server";

/**
 * Verify admin access using the authenticated Supabase user ID.
 * Do this before resolving a rewards customer or reserving a credit.
 * Neither a client-provided email nor a request header can grant access.
 */
async function authenticatedAdmin() {
  const userClient = await createUserClient();
  const { data: { user } = {}, error: authError } = await userClient.auth.getUser();

  if (authError) {
    if (/auth session missing/i.test(authError.message || "")) return false;
    throw authError;
  }
  if (!user?.id) return false;

  const serviceClient = rewardsAdmin();
  const { data: adminRow, error: adminError } = await serviceClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) throw adminError;
  return Boolean(adminRow);
}

export function withAiPass(existingPost) {
  return async function POST(request) {
    let admin;
    let requestId;
    let reserved = false;

    try {
      // Verified admins do not reserve, deduct, or finalize AI passes.
      // OpenAI usage is still billed to the project's API account.
      if (await authenticatedAdmin()) {
        return await existingPost(request);
      }

      const ctx = await currentRewardsCustomer();
      admin = ctx.admin;
      requestId = crypto.randomUUID();

      const { data: allowed, error: reserveError } = await admin.rpc(
        "es_reserve_ai_pass",
        { p_customer: ctx.customer.id, p_request: requestId }
      );
      if (reserveError) throw reserveError;

      if (!allowed) {
        return NextResponse.json(
          {
            error: "No AI credits remaining. New customers start with 3 AI credits. Each fulfilled order adds 1 more AI credit.",
            code: "AI_PASSES_EXHAUSTED",
          },
          { status: 429 }
        );
      }

      reserved = true;
      let response;
      try {
        response = await existingPost(request);
      } catch (generationError) {
        console.error("AI handler failed", generationError);
        response = NextResponse.json(
          { error: "AI generation failed." },
          { status: 500 }
        );
      }

      // Preserve existing success criteria, including compatibility with
      // other AI endpoints that may not return the same JSON shape.
      const success = response instanceof Response && response.ok;
      const { error: finishError } = await admin.rpc(
        "es_finish_ai_pass",
        { p_request: requestId, p_success: success }
      );
      if (finishError) {
        console.error("AI pass finalization failed", finishError);
        return NextResponse.json(
          { error: "AI pass could not be finalized. Contact support before retrying." },
          { status: 503 }
        );
      }
      reserved = false;
      return response;
    } catch (error) {
      console.error("AI pass enforcement failed", error);
      if (reserved && admin && requestId) {
        const { error: refundError } = await admin.rpc(
          "es_finish_ai_pass",
          { p_request: requestId, p_success: false }
        );
        if (refundError) console.error("AI pass refund failed", refundError);
      }
      return NextResponse.json(
        { error: "AI generation is temporarily unavailable." },
        { status: 503 }
      );
    }
  };
}