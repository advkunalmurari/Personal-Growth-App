// Life OS Service Worker — Serwist strategy
// Place at: apps/web/app/sw.ts
// Installed via @serwist/next in next.config.mjs
//
// Setup:
//   npm install @serwist/next serwist --save-dev
//   Then import in next.config.mjs:
//   import withSerwist from '@serwist/next'
//   const config = withSerwist({ swSrc: 'app/sw.ts', swDest: 'public/sw.js' })(nextConfig)

import { defaultCache } from '@serwist/next/worker'
import { Serwist } from 'serwist'

declare const self: ServiceWorkerGlobalScope & {
    __SW_MANIFEST: (string | { revision: string | null; url: string })[]
}

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // ─── API routes: Network First (always fetch fresh data, cache as backup) ──
        {
            matcher: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 5, // 5 min
                },
            },
        },

        // ─── Static assets: Cache First (content-addressed, never stale) ───────────
        {
            matcher: /\.(js|css|png|jpg|webp|svg|woff2|ico)$/,
            handler: 'CacheFirst',
            options: {
                cacheName: 'assets-cache',
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },

        // ─── App pages: Stale While Revalidate (fast + keeps content fresh) ────────
        {
            matcher: /^\/(?!api)/,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'pages-cache',
                expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
            },
        },

        // ─── Default fallback ────────────────────────────────────────────────────────
        ...defaultCache,
    ],
})

serwist.addEventListeners()
