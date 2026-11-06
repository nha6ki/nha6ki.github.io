import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/projects',
  }),

  schema: z.object({
    title: z.string(),
    summary: z.string(),
    technologies: z.array(z.string()),
    order: z.number().int().min(1),
    featured: z.boolean().default(false),

    date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
    image: z.string().optional(),

    links: z.array(
      z.object({
        label: z.string(),
        url: z.string().url(),
      })
    ).default([]),
  }),
});

export const collections = { projects };
