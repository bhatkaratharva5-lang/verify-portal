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
  const apiKey = env.SHRTFLY_API_KEY;
  const botHandle = "FILE_STOREB_BOT";

  // Destination back to Telegram with the verified code
  const telegramTarget = "https://t.me/" + botHandle + "?start=v_" + encodeURIComponent(fileCode);

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key missing in Cloudflare Environment" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  let finalShortUrl = telegramTarget;

  try {
    // Strictly encode the destination URL so Shrtfly parses it as a valid URL
    const encodedDestination = encodeURIComponent(telegramTarget);
    const apiUrl = "https://shrtfly.com/api?api=" + apiKey.trim() + "&url=" + encodedDestination;

    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const data = await res.json();

    // Check Shrtfly response structure
    if (data && data.status === "success" && (data.shortenedUrl || data.result)) {
      finalShortUrl = data.shortenedUrl || data.result;
    } else {
      // If Shrtfly returns error object, route through fallback gateway format
      finalShortUrl = "https://shrtfly.com/st?api=" + apiKey.trim() + "&url=" + encodedDestination;
    }
  } catch (err) {
    // Secondary fallback
    finalShortUrl = "https://shrtfly.com/st?api=" + apiKey.trim() + "&url=" + encodeURIComponent(telegramTarget);
  }

  // Send back clean JSON response
  return new Response(JSON.stringify({ redirectUrl: finalShortUrl }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
