import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sessionId = req.query.state as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    // Initialize Redis
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || '',
      token: process.env.KV_REST_API_TOKEN || '',
    });

    // Check if token exists in Redis
    const key = `auth:${sessionId}`;
    const data = await redis.get(key);

    if (!data) {
      // Not ready yet
      return res.status(200).json({ ready: false });
    }

    // Parse token data safely
    const tokenData = typeof data === 'string' ? JSON.parse(data) : data;

    // Delete from Redis after retrieval (one-time use)
    await redis.del(key);

    return res.status(200).json({
      ready: true,
      token: tokenData.access_token || tokenData.token,
      refresh_token: tokenData.refresh_token
    });

  } catch (err: any) {
    console.error('check-auth error:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: err?.message || 'Unknown error',
      sessionId: req.query.state
    });
  }
}
