import { z, defineCollection } from 'astro:content'

// 3. Export a single `collections` object to register your collection(s)
export const collections = {
  destinations: defineCollection({
    type: 'data',
    schema: ({ image }) =>
      z.object({
        name: z.string(),
        image: image(),
        description: z.string(),
        distance: z.string(),
        travel: z.string(),
      }),
  }),

  crew: defineCollection({
    type: 'data',
    schema: ({ image }) =>
      z.object({
        name: z.string(),
        image: image(),
        role: z.string(),
        bio: z.string(),
      }),
  }),

  technology: defineCollection({
    type: 'data',
    schema: ({ image }) =>
      z.object({
        name: z.string(),
        images: z.object({
          portrait: image(),
          landscape: image(),
        }),
        description: z.string(),
      }),
  }),
}
