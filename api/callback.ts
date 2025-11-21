export default async function handler(req: any, res: any) {
  const { code, state: email, error, error_description } = req.query;

  if (error) {
    return renderCloseWithError(res, error_description || "Authentication failed");
  }

  if (!code || !email) {
    return renderCloseWithError(res, "Missing code or state from Pinterest.");
  }

  // 🔥 Enviar el código directamente al plugin (postMessage)
  return renderSendCodeToPlugin(res, code);
}

/* --------------------------------------------------
   HTML que envía el code al plugin y cierra la ventana
---------------------------------------------------*/
function renderSendCodeToPlugin(res: any, code: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Returning to Figma…</title>
</head>
<body>
<script>
  // Enviar el code al plugin
  window.opener?.postMessage(
    { pluginMessage: { type: "authorization-code", code: "${code}" } },
    "*"
  );

  // Cerrar la ventana después de enviar el mensaje
  window.close();
</script>
Returning to Figma…
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}

/* --------------------------------------------------
   HTML en caso de error
---------------------------------------------------*/
function renderCloseWithError(res: any, message: string) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Error</title></head>
<body>
<script>
  window.opener?.postMessage(
    { pluginMessage: { type: "auth-failed", message: "${message}" } },
    "*"
  );
  window.close();
</script>
Authentication error: ${message}
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
