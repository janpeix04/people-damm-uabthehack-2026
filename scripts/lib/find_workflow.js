// Resuelve el ID de un workflow en la instancia n8n local a partir del prefijo de su nombre ("WF-01", ...).
// Evita IDs hardcodeados que solo existen en una instancia concreta.
export async function findWorkflowIdByPrefix(client, prefix) {
  const list = await client.request("GET", "/workflows");
  const match = (list.data || []).find((wf) => wf.name?.startsWith(prefix));
  if (!match) {
    throw new Error(`No se encontró ningún workflow cuyo nombre empiece por '${prefix}'. Ejecuta antes scripts/deploy_wf0X.js.`);
  }
  return match.id;
}
