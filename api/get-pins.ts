const fetch = require('node-fetch');

// --- ¡IMPORTANTE! Reemplaza estos IDs con los de tus boards de Pinterest ---
const boardIdMap: { [key: string]: string } = {
  'landing': '1105844952192711146',
  'dashboard': 'REEMPLAZA_CON_EL_ID_DE_TU_BOARD_DE_DASHBOARDS',
  'typography': 'REEMPLAZA_CON_EL_ID_DE_TU_BOARD_DE_TIPOGRAFIA',
  'mobile-app': 'REEMPLAZA_CON_EL_ID_DE_TU_BOARD_DE_MOBILE_APPS'
};

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  const { category, token } = req.body;
  if (!category || !token) { return res.status(400).json({ error: 'Category and token are required.' }); }

  const boardId = boardIdMap[category];
  if (!boardId || boardId.startsWith('REEMPLAZA')) { return res.status(404).json({ error: 'Category not found or Board ID not configured.' }); }

  // Pedimos explícitamente el campo 'media' que contiene las imágenes
  const pinterestApiUrl = `https://api.pinterest.com/v5/boards/${boardId}/pins?pin_fields=media`;

  try {
    const response = await fetch(pinterestApiUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pinterest API responded with status ${response.status}: ${errorData.message}`);
    }

    const data: any = await response.json();
    
    // --- LÓGICA DE EXTRACCIÓN DE IMÁGENES ACTUALIZADA ---
    const pins = data.items.map((pin: any) => {
      const images = pin.media?.images;
      // Prioridad para la imagen grande: original -> 1200px -> 600px
      const fullsizeUrl = images?.originals?.url || images?.['1200x']?.url || images?.['600x']?.url || '';
      // Prioridad para la miniatura: 400px -> 600px -> la grande si no hay otra
      const thumbnailUrl = images?.['400x300']?.url || images?.['600x']?.url || fullsizeUrl;
      
      return {
        id: pin.id,
        title: pin.title,
        description: pin.description,
        thumbnailUrl: thumbnailUrl,
        fullsizeUrl: fullsizeUrl,
      };
    });

    res.status(200).json(pins);

  } catch (e: any) {
    console.error('Error in get-pins function:', e);
    res.status(500).json({ error: e.message || 'Internal server error.' });
  }
}