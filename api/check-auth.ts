import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sessionId = req.query.state as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    const REDIS_URL = process.env.KV_REST_API_URL;
    const REDIS_TOKEN = process.env.KV_REST_API_TOKEN;

    if (!REDIS_URL || !REDIS_TOKEN) {
      return res.status(500).json({ error: 'Redis not configured' });
    }

    const key = `auth:${sessionId}`;

    // Get data from Redis using REST API
    const getRes = await fetch(`${REDIS_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });

    const getData = await getRes.json();

    if (!getData.result) {
      // Not ready yet
      return res.status(200).json({ ready: false });
    }

    // Parse token data
    const tokenData = typeof getData.result === 'string' 
      ? JSON.parse(getData.result) 
      : getData.result;

    // Delete from Redis
    await fetch(`${REDIS_URL}/del/${key}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });

    return res.status(200).json({
      ready: true,
      token: tokenData.access_token,
      refresh_token: tokenData.refresh_token
    });

  } catch (err: any) {
    console.error('check-auth error:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: err?.message || 'Unknown'
    });
  }
}
