import type { Health } from '@superjoin/contracts';
const base = import.meta.env.VITE_API_BASE_URL;
if (!base) throw new Error('VITE_API_BASE_URL is required');
const api = (path: string) => `${base.replace(/\/$/, '')}${path}`;
export async function getHealth(signal: AbortSignal): Promise<Health> {
  const response = await fetch(api('/health'), { signal });
  if (!response.ok && response.status !== 503) throw new Error('Backend health request failed');
  return response.json();
}
export async function listDocuments() { const response = await fetch(api('/api/documents')); if (!response.ok) throw new Error('Could not load documents'); return response.json(); }
export async function listFacts() { const response = await fetch(api('/api/facts')); if (!response.ok) throw new Error('Could not load facts'); return response.json(); }
export async function getFact(id: string) { const response = await fetch(api(`/api/facts/${id}`)); if (!response.ok) throw new Error('Could not load fact'); return response.json(); }
export async function listRelationships() { const response = await fetch(api('/api/relationships')); if (!response.ok) throw new Error('Could not load relationships'); return response.json(); }
export async function uploadPdf(file: File) { const form = new FormData(); form.append('file', file); const response = await fetch(api('/api/documents'), { method: 'POST', body: form }); if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error?.message || 'Upload failed'); } return response.json(); }
