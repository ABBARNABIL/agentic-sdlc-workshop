import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getImageAssets, repositoryRoot } from '../../lib/content';

export const getStaticPaths = (async () => (await getImageAssets()).map(asset => ({ params: { asset } }))) satisfies GetStaticPaths;
export const GET: APIRoute = async ({ params }) => {
  if (!params.asset || !(await getImageAssets()).includes(params.asset)) return new Response('Asset not found', { status: 404 });
  const bytes = await readFile(path.join(repositoryRoot, ...params.asset.split('/')));
  const types: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp' };
  return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': types[path.extname(params.asset)] ?? 'application/octet-stream' } });
};
