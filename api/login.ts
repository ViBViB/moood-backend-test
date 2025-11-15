import type { VercelRequest, VercelResponse } from '@vercel/node';

const PINTEREST_CLIENT_ID = process.env.PINTEREST_CLIENT_ID;
const PINTEREST_REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI;
const PINTEREST_SCOPE = 'boards:read,pins:read';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send('Email is required.');
  }
  if (!PINTEREST_CLIENT_ID || !PINTEREST_REDIRECT_URI) {
    return res.status(500).send('Server configuration error: Missing Pinterest environment variables.');
  }

  const pinterestAuthUrl = new URL('https://www.pinterest.com/oauth/');
  pinterestAuthUrl.searchParams.append('client_id', PINTEREST_CLIENT_ID);
  pinterestAuthUrl.searchParams.append('redirect_uri', PINTEREST_REDIRECT_URI);
  pinterestAuthUrl.searchParams.append('scope', PINTEREST_SCOPE);
  pinterestAuthUrl.searchParams.append('response_type', 'code');
  pinterestAuthUrl.searchParams.append('state', Array.isArray(email) ? email[0] : email);

  res.redirect(307, pinterestAuthUrl.toString());
}
