export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. Extract file code (?file=f_xxxx)
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

  // 2. Fetch the API key from Cloudflare Environment Variables
  const apiKey = env.SHRTFLY_API_KEY;
  const botHandle = "FILE_STOREB_BOT";
  const telegramTarget = `https://t.me/${botHandle}?start=v_${fileCode}`;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SHRTFLY_API_KEY environment variable not configured" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  let finalShortUrl = telegramTarget;

  // 3. Request genuine short URL directly from Shrtfly API
  try {
    const apiUrl = `https://shrtfly.com/api?api=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(telegramTarget)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data && data.status === "success" && data.shortenedUrl) {
      finalShortUrl = data.shortenedUrl;
    } else {
      // Fallback format if API JSON structure differs
      finalShortUrl = `https://shrtfly.com/full?api=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(telegramTarget)}`;
    }
  } catch (err) {
    // Secondary fallback
    finalShortUrl = `https://shrtfly.com/full?api=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(telegramTarget)}`;
  }

  // 4. Return the valid link to the portal frontend
  return new Response(JSON.stringify({ redirectUrl: finalShortUrl }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
