const fetch = require('node-fetch');

export default async function handler(req: any, res: any) {
    // Añadimos headers de CORS también a este endpoint
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const imageUrl = req.query.url as string;

    if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL is required' });
    }

    try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.buffer();
        
        // Enviamos la imagen con el tipo de contenido correcto
        res.setHeader('Content-Type', imageResponse.headers.get('content-type'));
        res.status(200).send(imageBuffer);

    } catch (error: any) {
        console.error(`Error proxying image ${imageUrl}:`, error);
        res.status(500).json({ error: error.message });
    }
}