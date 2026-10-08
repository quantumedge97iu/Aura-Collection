export const API_VERSION = "2025-02-19";

export type CmsConfig = {
  projectId?: string;
  dataset?: string;
  token?: string;
  preview?: boolean;
};

export type CacheHint = {
  revalidate?: number;
  tags?: string[];
};

type QueryResult<T> = { result: T };

export function cmsConfigured(config: CmsConfig) {
  return Boolean(config.projectId && config.dataset);
}

export async function cmsQuery<T>(query: string, config: CmsConfig, params?: Record<string, string>, cache?: CacheHint): Promise<T | null> {
  if (!cmsConfigured(config)) return null;
  const preview = Boolean(config.preview);
  const host = preview ? "api.sanity.io" : "apicdn.sanity.io";
  const url = new URL(`https://${host}/v${API_VERSION}/data/query/${config.dataset}`);
  url.searchParams.set("query", query);
  if (preview) url.searchParams.set("perspective", "previewDrafts");
  for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(`$${key}`, JSON.stringify(value));

  const headers: Record<string, string> = {};
  if (preview && config.token) headers.Authorization = `Bearer ${config.token}`;

  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = { headers };
  if (preview) init.cache = "no-store";
  else if (cache) init.next = { revalidate: cache.revalidate ?? 60, tags: cache.tags ?? ["editorial"] };

  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`Sanity query failed (${response.status})`);
  const body = (await response.json()) as QueryResult<T>;
  return body.result ?? null;
}
