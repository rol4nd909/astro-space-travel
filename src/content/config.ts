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
}
