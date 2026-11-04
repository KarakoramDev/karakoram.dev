// SPDX-License-Identifier: Apache-2.0
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getBlogPosts, blogPath } from '../../lib/blog';
import { withBase } from '../../lib/paths';

export async function GET(context: APIContext) {
	return rss({
		title: 'Karakoram Blog',
		description: 'Notes on self-hosted databases, operations and building Karakoram.',
		site: new URL(withBase('/blog/'), context.site!),
		items: (await getBlogPosts()).map(({ id, data }) => ({
			title: data.title,
			description: data.description,
			pubDate: data.pubDate,
			link: blogPath(id),
		})),
		customData: '<language>en</language>',
	});
}
