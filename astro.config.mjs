import { readFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'

const LP_HOST = 'lp.lolla8.com'

// Serves the /lp page at the root of lp.lolla8.com. Runs after the Vercel
// adapter has written .vercel/output/config.json and prepends a host-scoped
// rewrite so it takes effect before the filesystem (index.html) is matched.
function lpSubdomain() {
  return {
    name: 'lp-subdomain',
    hooks: {
      'astro:build:done': ({ logger }) => {
        const path = new URL('./.vercel/output/config.json', import.meta.url)
        const config = JSON.parse(readFileSync(path, 'utf8'))
        config.routes.unshift({
          src: '^/?$',
          has: [{ type: 'host', value: LP_HOST }],
          dest: '/lp/index.html',
        })
        writeFileSync(path, JSON.stringify(config, null, '\t'))
        logger.info(`Rewrite ${LP_HOST}/ → /lp added`)
      },
    },
  }
}

export default defineConfig({
  site: 'https://lolla8.com',
  output: 'server',
  adapter: vercel(),
  integrations: [
    sitemap({ filter: (page) => !page.includes('/lp') }),
    lpSubdomain(),
  ],
})
