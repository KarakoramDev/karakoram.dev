// SPDX-License-Identifier: Apache-2.0
// robots.txt as a static endpoint so the sitemap URL follows SITE_URL and BASE_PATH.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
	const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
	const sitemap = new URL(`${base}sitemap-index.xml`, site ?? 'https://karakoram.dev').href;
	return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
