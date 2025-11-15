const fetch = require('node-fetch');

// --- ¡IMPORTANTE! Reemplaza estos IDs con los de tus boards de Pinterest ---
const boardIdMap: { [key: string]: string } = {
  'landing': '1105844952192711146',
  'dashboard': 'REEMPLAZA_CON_EL_ID_DE_TU_BOARD_DE_DASHBOARDS',
  'typography': 'REEMPLAZA_CON_EL_ID_DE_TU_BOARD_DE_TIPOGRAFIA',
  'mobile-app': 'REEMPLAZA_CON_EL_ID_DE_TU_BOARD_DE_MOBILE_APPS'
};

export default async function handler(req: any, res: any) {
  // --- Headers para dar permiso de CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permite cualquier origen
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Vercel necesita responder a la solicitud 'OPTIONS' que hace el navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // --- Fin de la sección de CORS ---

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { category, token } = req.body;

  if (!category || !token) {
    return res.status(400).json({ error: 'Category and token are required.' });
  }

  const boardId = boardIdMap[category];

  if (!boardId || boardId.startsWith('REEMPLAZA')) {
    return res.status(404).json({ error: 'Category not found or Board ID not configured.' });
  }

  const pinterestApiUrl = `https://api.pinterest.com/v5/boards/${boardId}/pins`;

  try {
    const response = await fetch(pinterestApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Pinterest API error:', errorData);
      throw new Error('Failed to fetch pins from Pinterest.');
    }

    const data: any = await response.json();
    const pins = data.items.map((pin: any) => ({
      id: pin.id,
      title: pin.title,
      description: pin.description,
      imageUrl: pin.media?.image_cover_url || ''
    }));

    res.status(200).json(pins);

  } catch (e: any) {
    console.error('Error in get-pins function:', e);
    res.status(500).json({ error: e.message || 'Internal server error.' });
  }
}