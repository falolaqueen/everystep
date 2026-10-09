import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createUserClient } from "@/lib/supabase/server";

const COOKIE = "es_guest_id";
const COOKIE_AGE = 60 * 60 * 24 * 365;
const validToken = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export function rewardsAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service-role configuration");
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function ensureBalance(admin, id) {
  const { error } = await admin.from("es_ai_balances")
    .upsert({ customer_id: id }, { onConflict: "customer_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function currentRewardsCustomer() {
  const admin = rewardsAdmin();
  const jar = await cookies();
  const userClient = await createUserClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError && !/auth session missing/i.test(authError.message || "")) throw authError;

  let token = jar.get(COOKIE)?.value;
  if (!validToken(token)) {
    token = crypto.randomBytes(32).toString("hex");
    jar.set(COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: COOKIE_AGE,
    });
  }
  const guestHash = hashToken(token);

  if (user) {
    const { data: id, error } = await admin.rpc("es_resolve_rewards_customer", {
      p_auth_user: user.id, p_email: user.email || null, p_guest_hash: guestHash,
    });
    if (error) throw error;
    await ensureBalance(admin, id);
    return { admin, customer: { id, auth_user_id: user.id }, registered: true };
  }

  // A guest cookie already linked to a registered account must not become a fresh guest.
  const { data: existing, error: lookupError } = await admin.from("es_customers")
    .select("id,auth_user_id").eq("guest_token_hash", guestHash).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.auth_user_id) {
    // Signed out: rotate to a new guest identity. A cookie alone cannot access member rewards.
    token = crypto.randomBytes(32).toString("hex");
    jar.set(COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: COOKIE_AGE,
    });
  }
  const hash = hashToken(token);
  const { data: customer, error } = await admin.from("es_customers")
    .upsert({ guest_token_hash: hash }, { onConflict: "guest_token_hash" })
    .select("id,auth_user_id").single();
  if (error) throw error;
  await ensureBalance(admin, customer.id);
  return { admin, customer, registered: false };
}

export async function getRewardsSnapshot() {
  const { admin, customer, registered } = await currentRewardsCustomer();
  const { data: balance, error } = await admin.from("es_ai_balances")
    .select("available").eq("customer_id", customer.id).single();
  if (error) throw error;
  let coins = null;
  if (registered) {
    const { data: entries, error: ledgerError } = await admin.from("es_coin_ledger")
      .select("coins").eq("customer_id", customer.id);
    if (ledgerError) throw ledgerError;
    coins = (entries || []).reduce((sum, entry) => sum + entry.coins, 0);
  }
  let isAdmin = false;
  if (registered && customer.auth_user_id) {
    const { data: adminRow, error: adminError } = await admin.from("admin_users")
      .select("user_id").eq("user_id", customer.auth_user_id).maybeSingle();
    if (adminError) throw adminError;
    isAdmin = Boolean(adminRow);
  }
  return { aiPasses: isAdmin ? "Unlimited" : balance.available, isAdmin, registered, coins, redemptionMinimum: 1000 };
}
