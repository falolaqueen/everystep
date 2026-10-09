import "server-only";
export async function notifyReceipt({ orderNumber, amount }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_ADMIN_RECIPIENT?.replace(/\D/g, "");
  const template = process.env.WHATSAPP_TEMPLATE_NAME || "payment_receipt_alert";
  const version = process.env.WHATSAPP_API_VERSION;
  if (!token || !phoneId || !recipient || !version) throw new Error("WhatsApp Cloud API not configured");
  if (!/^v\d+\.\d+$/.test(version)) throw new Error("Invalid WhatsApp API version");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: recipient, type: "template", template: {
      name: template, language: { code: "en" }, components: [{ type: "body", parameters: [
        { type: "text", text: orderNumber }, { type: "text", text: `NGN ${Number(amount).toLocaleString("en-NG")}` }
      ] }] } }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`WhatsApp API returned ${response.status}`);
  return response.json();
}
