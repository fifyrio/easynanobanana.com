import type { KIETaskMetadata } from './kie-api/types';

const kvAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const kvApiToken = process.env.CLOUDFLARE_KV_API_TOKEN;

type KvFetchOptions = {
  revalidateSeconds?: number;
};

export const hasKvConfig = Boolean(kvAccountId && kvNamespaceId && kvApiToken);

const KV_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${kvAccountId}/storage/kv/namespaces/${kvNamespaceId}`;

function kvHeaders(): HeadersInit {
  return { 'Authorization': `Bearer ${kvApiToken}` };
}

export async function fetchKvJson<T>(key: string, options: KvFetchOptions = {}): Promise<T | null> {
  if (!hasKvConfig) {
    return null;
  }

  const encodedKey = encodeURIComponent(key);
  const url = `${KV_BASE_URL}/values/${encodedKey}`;
  const response = await fetch(url, {
    headers: kvHeaders(),
    next: { revalidate: options.revalidateSeconds ?? 3600 },
  });

  if (!response.ok) {
    console.warn(`KV fetch failed for ${key}: ${response.status}`);
    return null;
  }

  try {
    const data = (await response.json()) as T;
    return data;
  } catch (error) {
    console.warn(`KV JSON parse failed for ${key}`, error);
    return null;
  }
}

// ===== KIE Task Metadata KV Operations =====

function taskKey(taskId: string): string {
  return `kie-task:${taskId}`;
}

async function kvPut(key: string, value: string, expirationTtl = 86400): Promise<void> {
  const url = `${KV_BASE_URL}/values/${encodeURIComponent(key)}?expiration_ttl=${expirationTtl}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...kvHeaders(), 'Content-Type': 'text/plain' },
    body: value,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`KV PUT failed (${res.status}): ${body}`);
  }
}

async function kvGet(key: string): Promise<string | null> {
  const url = `${KV_BASE_URL}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: kvHeaders(),
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`KV GET failed (${res.status}): ${body}`);
  }
  return res.text();
}

export async function saveKIETaskMetadataKV(metadata: KIETaskMetadata): Promise<void> {
  await kvPut(taskKey(metadata.taskId), JSON.stringify(metadata));
}

export async function getKIETaskMetadataKV(taskId: string): Promise<KIETaskMetadata | null> {
  const raw = await kvGet(taskKey(taskId));
  if (!raw) return null;
  return JSON.parse(raw) as KIETaskMetadata;
}

export async function updateKIETaskMetadataKV(
  taskId: string,
  updates: Partial<KIETaskMetadata>
): Promise<KIETaskMetadata | null> {
  const existing = await getKIETaskMetadataKV(taskId);
  if (!existing) return null;
  const updated: KIETaskMetadata = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveKIETaskMetadataKV(updated);
  return updated;
}
