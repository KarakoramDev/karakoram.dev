// SPDX-License-Identifier: Apache-2.0
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
	const pages = await getCollection('docs', ({ data }) => !data.draft);
	return pages.map((page) => ({
		params: { page: page.id.replace(/(?:^|\/)index$/, '') },
		props: { markdown: `---\ntitle: ${JSON.stringify(page.data.title)}\n---\n${page.body ?? ''}` },
	}));
};

export const GET: APIRoute = ({ props }) => new Response(props.markdown, {
	headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
