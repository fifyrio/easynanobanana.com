const kvAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const kvNamespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const kvApiToken = process.env.CLOUDFLARE_KV_API_TOKEN;

type KvFetchOptions = {
  revalidateSeconds?: number;
};

export const hasKvConfig = Boolean(kvAccountId && kvNamespaceId && kvApiToken);

export async function fetchKvJson<T>(key: string, options: KvFetchOptions = {}): Promise<T | null> {
  if (!hasKvConfig) {
    return null;
  }

  const encodedKey = encodeURIComponent(key);
  const url = `https://api.cloudflare.com/client/v4/accounts/${kvAccountId}/storage/kv/namespaces/${kvNamespaceId}/values/${encodedKey}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${kvApiToken}`,
    },
    next: { revalidate: options.revalidateSeconds ?? 3600 },
  });

  if (!response.ok) {
    console.warn(`KV fetch failed for ${key}: ${response.status}`);
    return null;
  }

  try {
    const data = (await response.json()) as T;
    // console.info(`KV fetch success for ${key}`);
    return data;
  } catch (error) {
    console.warn(`KV JSON parse failed for ${key}`, error);
    return null;
  }
}
