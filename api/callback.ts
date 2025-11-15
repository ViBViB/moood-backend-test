const fetch = require('node-fetch');

export default async function handler(req: any, res: any) {
  const { code, state: email, error, error_description } = req.query;
  const PINTEREST_CLIENT_ID = process.env.PINTEREST_CLIENT_ID;
  const PINTEREST_CLIENT_SECRET = process.env.PINTEREST_CLIENT_SECRET;
  const PINTEREST_REDIRECT_URI = process.env.PINTEREST_REDIRECT_URI;
  const PLUGIN_SUCCESS_PAGE_URL = process.env.PLUGIN_SUCCESS_PAGE_URL;

  if (!PLUGIN_SUCCESS_PAGE_URL || !PINTEREST_REDIRECT_URI) {
    return res.status(500).send('Server configuration error: Missing Redirect URIs.');
  }

  if (error) {
    return res.redirect(307, `${PLUGIN_SUCCESS_PAGE_URL}?error=${encodeURIComponent(Array.isArray(error_description) ? error_description[0] : error_description || 'Authentication failed')}`);
  }

  if (!code || !email) {
    return res.status(400).send('Missing code or state from Pinterest.');
  }

  try {
    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${PINTEREST_CLIENT_ID}:${PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: Array.isArray(code) ? code[0] : code,
        redirect_uri: PINTEREST_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as { message?: string };
      throw new Error(errorData.message || 'Failed to get access token');
    }

    const tokenData = await response.json() as { access_token: string };
    const accessToken = tokenData.access_token;
    
    res.redirect(307, `${PLUGIN_SUCCESS_PAGE_URL}?email=${encodeURIComponent(Array.isArray(email) ? email[0] : email)}&token=${encodeURIComponent(accessToken)}`);

  } catch (e: any) {
    res.redirect(307, `${PLUGIN_SUCCESS_PAGE_URL}?error=${encodeURIComponent(e.message || 'Internal server error')}`);
  }
}