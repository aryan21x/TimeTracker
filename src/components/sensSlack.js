export async function handler(event, context) {
  const allowedOrigins = [
    "https://timetracker-acb7d.web.app",  // ✅ Firebase frontend
    "http://localhost:3000",              // ✅ For local dev (optional)
  ];

  const origin = event.headers.origin;

  const isAllowedOrigin = allowedOrigins.includes(origin);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "Preflight OK",
    };
  }

  if (!isAllowedOrigin) {
    return {
      statusCode: 403,
      body: "Forbidden - CORS",
    };
  }

  try {
    const { text } = JSON.parse(event.body);

    const webhookURL = "https://hooks.slack.com/services/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";
    const response = await fetch(webhookURL, {
      method: "POST",
      body: JSON.stringify({ text }),
      headers: { "Content-Type": "application/json" },
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": origin,
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
