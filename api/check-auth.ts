import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sessionId = req.query.state as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing session ID' });
    }

    // Check if token exists in Redis
    const data = await redis.get(`auth:${sessionId}`);

    if (!data) {
      // Not ready yet
      return res.status(200).json({ ready: false });
    }

    // Parse token data
    let tokenData;
    if (typeof data === 'string') {
      tokenData = JSON.parse(data);
    } else {
      tokenData = data;
    }

    // Delete from Redis after retrieval (one-time use)
    await redis.del(`auth:${sessionId}`);

    return res.status(200).json({
      ready: true,
      token: tokenData.access_token,
      refresh_token: tokenData.refresh_token
    });

  } catch (err) {
    console.error('check-auth error:', err);
    return res.status(500).json({ 
      error: 'Server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
