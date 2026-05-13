import twilio from "twilio";

export async function POST(req: Request) {
  const { phone } = await req.json();

  if (!phone) {
    return Response.json({ error: "No phone number" }, { status: 400 });
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP in memory for now (temporary)
  globalThis.OTP_STORE = globalThis.OTP_STORE || {};
  globalThis.OTP_STORE[phone] = otp;

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER!,
    to: `whatsapp:${phone}`,
    body: `Your Twuanis login code: ${otp}`,
  });

  return Response.json({ success: true });
}