import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	blog: defineCollection({
		loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
		schema: z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			author: z.string().default('Samyazz'),
			tags: z.array(z.string()).optional(),
			canonical: z.string().url().optional(),
			draft: z.boolean().default(false),
		}),
	}),
	docs: defineCollection({
		loader: docsLoader(),
		// `brand`: key of src/lib/brands.mjs, written by scripts/ingest-docs.mjs for engine and provider pages;
		// StarlightPageTitle shows the mark next to the title.
		schema: docsSchema({ extend: z.object({ brand: z.string().optional() }) }),
	}),
};
