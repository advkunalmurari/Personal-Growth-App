import { NextRequest, NextResponse } from 'next/server'

// ─── In-Memory Rate Limiter ───────────────────────────────────────────────────
// For production at scale, replace with Upstash Redis
interface RateLimitEntry {
    count: number
    windowStart: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
    /** Max requests per window */
    limit: number
    /** Window size in seconds */
    windowSeconds: number
    /** Key prefix to namepsace different rate limits */
    prefix?: string
}

const DEFAULT_CONFIG: RateLimitConfig = {
    limit: 60,
    windowSeconds: 60,
    prefix: 'api',
}

/**
 * Rate limits a request by IP + optional user ID.
 * Returns `{ success: true }` if allowed, or `{ success: false, response }` if throttled.
 */
export function rateLimit(
    req: NextRequest,
    config: Partial<RateLimitConfig> = {}
): { success: true } | { success: false; response: NextResponse } {
    const { limit, windowSeconds, prefix } = { ...DEFAULT_CONFIG, ...config }

    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        '127.0.0.1'

    const key = `${prefix}:${ip}`
    const now = Date.now()
    const windowMs = windowSeconds * 1000

    const entry = store.get(key)

    if (!entry || now - entry.windowStart >= windowMs) {
        // Start a new window
        store.set(key, { count: 1, windowStart: now })
        return { success: true }
    }

    if (entry.count >= limit) {
        const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Too many requests. Please slow down.', retryAfter },
                {
                    status: 429,
                    headers: {
                        'Retry-After': retryAfter.toString(),
                        'X-RateLimit-Limit': limit.toString(),
                        'X-RateLimit-Remaining': '0',
                    },
                }
            ),
        }
    }

    entry.count++
    return { success: true }
}

// Cleanup old entries every 10 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now()
    Array.from(store.entries()).forEach(([key, entry]) => {
        if (now - entry.windowStart > 10 * 60 * 1000) {
            store.delete(key)
        }
    })
}, 10 * 60 * 1000)
