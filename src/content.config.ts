import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		// `brand`: key of src/lib/brands.mjs, written by scripts/ingest-docs.mjs for engine and backend pages;
		// StarlightPageTitle shows the mark next to the title.
		schema: docsSchema({ extend: z.object({ brand: z.string().optional() }) }),
	}),
};
