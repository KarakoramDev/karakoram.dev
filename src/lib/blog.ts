// SPDX-License-Identifier: Apache-2.0
import { getCollection } from 'astro:content';
import { withBase } from './paths';

export async function getBlogPosts() {
	const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id));
}

export const blogPath = (id: string) => withBase(`/blog/${id.split('/').map(encodeURIComponent).join('/')}/`);
export const formatDate = (date: Date) => new Intl.DateTimeFormat('en', {
	year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
}).format(date);
