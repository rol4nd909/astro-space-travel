import { defineConfig } from 'astro/config';

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: 'https://rol4nd909.github.io',
  integrations: [icon()]
});