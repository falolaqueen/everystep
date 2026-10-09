import "server-only";
import { currentRewardsCustomer, rewardsAdmin } from "@/lib/es-rewards-server";
import { createClient } from "@/lib/supabase/server";

export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
export async function customerOrder(id) {
  const { admin, customer } = await currentRewardsCustomer();
  const { data, error } = await admin.from("es_orders").select("*").eq("id", id).eq("customer_id", customer.id).maybeSingle();
  if (error) throw error;
  return { admin, order: data, customer };
}
export async function authorizedAdmin() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  const admin = rewardsAdmin();
  const { data: member, error: membershipError } = await admin.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (membershipError) throw membershipError;
  return member ? { admin, user } : null;
}
