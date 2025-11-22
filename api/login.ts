import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const email = req.query.email || "default@moood.app";
  const sessionId = req.query.state as string; // Session ID from plugin

  const CLIENT_ID = process.env.PINTEREST_CLIENT_ID!;
  const REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI!;
  const SUCCESS_URL = process.env.PINTEREST_SUCCESS_URL!;

  // Include sessionId in the state parameter
  const stateParam = `${SUCCESS_URL}?email=${email}&sessionId=${sessionId}`;

  const authUrl =
    `https://www.pinterest.com/oauth/?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=boards:read,pins:read` +
    `&state=${encodeURIComponent(stateParam)}`;

  res.redirect(authUrl);
}
