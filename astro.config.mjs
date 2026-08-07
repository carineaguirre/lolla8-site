import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: 'https://lolla8.com',
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap()],
})
