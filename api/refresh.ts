import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { refresh_token } = req.query;

    if (!refresh_token) {
      return res.status(400).json({ error: "Missing refresh_token" });
    }

    const CLIENT_ID = process.env.PINTEREST_CLIENT_ID!;
    const CLIENT_SECRET = process.env.PINTEREST_CLIENT_SECRET!;

    const refreshRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const json = await refreshRes.json();

    if (!json.access_token) {
      return res.status(500).json({ error: "Could not refresh token" });
    }

    res.json({
      access_token: json.access_token,
      expires_in: json.expires_in,
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Refresh error" });
  }
}
