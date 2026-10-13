// SPDX-License-Identifier: Apache-2.0
// Every internal link and asset URL must honour the configured base path, because the
// same build is served from https://karakoram.dev/ and from a GitHub Pages project path.

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Prefix a site-relative path ("/docs/", "/og.png") with the base path. */
export function withBase(path: string): string {
	return base + path.replace(/^\//, '');
}
