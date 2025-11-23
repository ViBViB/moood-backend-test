import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    console.log('Callback received - code:', code ? 'present' : 'missing', 'state:', state);

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    const CLIENT_ID = process.env.PINTEREST_CLIENT_ID!;
    const CLIENT_SECRET = process.env.PINTEREST_CLIENT_SECRET!;
    const REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI!;

    console.log('Environment check - CLIENT_ID:', CLIENT_ID ? 'present' : 'missing');
    console.log('REDIRECT_URI:', REDIRECT_URI);

    const tokenUrl = "https://api.pinterest.com/v5/oauth/token";

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    console.log('Pinterest response status:', tokenRes.status);

    const tokenJson: any = await tokenRes.json();
    console.log('Pinterest response:', JSON.stringify(tokenJson));

    if (!tokenJson.access_token) {
      console.error('No access token in response:', tokenJson);
      return res.status(500).send("OAuth Error: " + (tokenJson.message || tokenJson.error || "No access token"));
    }

    // Extract session ID from state
    let sessionId = state;
    try {
      const url = new URL(state);
      sessionId = url.searchParams.get('sessionId') || state;
    } catch {
      // If state is not a URL, use it directly
    }

    console.log('Session ID:', sessionId);

    const REDIS_URL = process.env.KV_REST_API_URL;
    const REDIS_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!REDIS_URL || !REDIS_TOKEN) {
      return res.status(500).send("Redis not configured");
    }

    // Store token in Redis
    const key = `auth:${sessionId}`;
    const value = JSON.stringify({
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      timestamp: Date.now()
    });

    const redisRes = await fetch(`${REDIS_URL}/setex/${key}/300`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    });

    console.log('Redis storage status:', redisRes.status);

    // Success page
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
          .box { background: white; padding: 40px; border-radius: 10px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #000; margin: 0 0 10px 0; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>✓ Connected!</h1>
          <p>You can close this window and return to Figma.</p>
        </div>
      </body>
      </html>
    `);

  } catch (err: any) {
    console.error('Callback error:', err);
    return res.status(500).send("OAuth callback error: " + err.message);
  }
}
