import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categories, projectCategories } from './lib/categories';

const projects = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/projects',
  }),

  schema: z.object({
    title: z.string(),
    category: z.enum([...categories.map(({ id }) => id), 'other']).default('other'),
    categories: z.array(z.enum([...projectCategories.map(({ id }) => id), 'other'])).min(1).optional(),
    summary: z.string(),
    technologies: z.array(z.string()),
    order: z.number().int().nonnegative(),
    featured: z.boolean().default(false),

    date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),

    links: z.array(
      z.object({
        label: z.string(),
        url: z.url(),
      })
    ).default([]),
  }).transform(data => ({
    ...data,
    categories: data.categories ?? [data.category],
  })),
});

export const collections = { projects };
