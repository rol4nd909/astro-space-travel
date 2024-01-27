import { defineConfig } from 'astro/config';
import icon from "astro-icon";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://rol4nd909.github.io',
  integrations: [
    icon(),
    react()
  ]
});