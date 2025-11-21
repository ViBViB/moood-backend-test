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

  // Si Pinterest devolvió error → redirigimos con mensaje
  if (error) {
    return res.redirect(
      307,
      `${PLUGIN_SUCCESS_PAGE_URL}?error=${encodeURIComponent(
        Array.isArray(error_description)
          ? error_description[0]
          : error_description || 'Authentication failed'
      )}`
    );
  }

  // Validación básica
  if (!code || !email) {
    return res.status(400).send('Missing code or state from Pinterest.');
  }

  try {
    // Intercambiar code → access_token
    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${PINTEREST_CLIENT_ID}:${PINTEREST_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: Array.isArray(code) ? code[0] : code,
        redirect_uri: PINTEREST_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get access token');
    }

    const tokenJson = await response.json();
    const accessToken = tokenJson.access_token;

    // Redirigir a la página manual que ya funciona
    return res.redirect(
      307,
      `${PLUGIN_SUCCESS_PAGE_URL}?token=${encodeURIComponent(accessToken)}`
    );

  } catch (e: any) {
    return res.redirect(
      307,
      `${PLUGIN_SUCCESS_PAGE_URL}?error=${encodeURIComponent(
        e.message || 'Internal server error'
      )}`
    );
  }
}
