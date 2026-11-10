export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. Extract file code from query parameter (?file=f_xxxx)
  const fileCode = url.searchParams.get("file");
  if (!fileCode) {
    return new Response(JSON.stringify({ error: "Missing file code parameter" }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  }

  // 2. Fetch the protected key from Cloudflare Environment Variables or fallback
  const apiKey = env.SHRTFLY_API_KEY || "YOUR_SHRTFLY_API_KEY_HERE";
  const botHandle = "FILE_STOREB_BOT";

  // 3. Construct Telegram return endpoint with verified prefix 'v_'
  const telegramTarget = `https://t.me/${botHandle}?start=v_${fileCode}`;

  // 4. Wrap with active Shrtfly gateway URL
  const monetizedUrl = `https://shrtfly.com/st?api=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(telegramTarget)}`;

  // 5. Send back JSON response to client
  return new Response(JSON.stringify({ redirectUrl: monetizedUrl }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
