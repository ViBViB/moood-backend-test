import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from "node-fetch";

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

    const returnUrl =
      decodeURIComponent(state) +
      `&token=${accessToken}&refresh=${refreshToken}`;

    return res.redirect(returnUrl);

  } catch (err) {
    console.error(err);
    return res.status(500).send("OAuth callback error");
  }
}
