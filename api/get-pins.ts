const fetch = require('node-fetch');

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

  // --- ¡CAMBIO CLAVE AQUÍ! ---
  // Le pedimos a Pinterest que incluya los datos de la imagen.
  const pinterestApiUrl = `https://api.pinterest.com/v5/boards/${boardId}/pins?pin_fields=image_cover_url`;

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
    
    // Devolvemos los datos crudos de nuevo para verificar
    res.status(200).json(data.items);

  } catch (e: any) {
    console.error('Error in get-pins function:', e);
    res.status(500).json({ error: e.message || 'Internal server error.' });
  }
}