import type { APIRoute } from 'astro';
import { getSearchEntries } from '../lib/content';

export const GET: APIRoute = async () => new Response(JSON.stringify(await getSearchEntries()), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});
