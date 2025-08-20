export const sseClients = new Map();

export function broadcastProgress(fileId, payload) {
  const set = sseClients.get(fileId);
  if (!set) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try { res.write(data); } catch {}
  }
}