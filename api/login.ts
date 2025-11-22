import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const email = req.query.email || "default@moood.app";

  const CLIENT_ID = process.env.PINTEREST_CLIENT_ID!;
  const REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI!;
  const SUCCESS_URL = process.env.PINTEREST_SUCCESS_URL!;

  const authUrl =
    `https://www.pinterest.com/oauth/?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=boards:read,pins:read` +
    `&state=${encodeURIComponent(SUCCESS_URL + "?email=" + email)}`;

  res.redirect(authUrl);
}
