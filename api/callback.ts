import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from "node-fetch";
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.STORAGE_REST_API_URL!,
  token: process.env.STORAGE_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    const CLIENT_ID = process.env.PINTEREST_CLIENT_ID!;
    const CLIENT_SECRET = process.env.PINTEREST_CLIENT_SECRET!;
    const REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI!;

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

    const tokenJson = await tokenRes.json();

    if (!tokenJson.access_token) {
      return res.status(500).send("OAuth Error: No access token");
    }

    const accessToken = tokenJson.access_token;
    const refreshToken = tokenJson.refresh_token;

    // Extract session ID from state (format: "SUCCESS_URL?email=...&sessionId=...")
    const sessionId = new URL(state).searchParams.get('sessionId') || state;

    // Store token in Redis with 5 minute expiration
    await redis.setex(`auth:${sessionId}`, 300, JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      timestamp: Date.now()
    }));

    // Redirect to success page
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

  } catch (err) {
    console.error(err);
    return res.status(500).send("OAuth callback error");
  }
}
