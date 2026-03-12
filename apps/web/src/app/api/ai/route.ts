import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
import { routeAI, type AITask } from '@/lib/ai/deepseek'
import {
    goalCascadePrompt, GOAL_CASCADE_SYSTEM,
    taskBreakdownPrompt, TASK_BREAKDOWN_SYSTEM,
    procrastinationPrompt, PROCRASTINATION_SYSTEM,
    schedulePrompt, SCHEDULE_SYSTEM,
    reviewAnalysisPrompt, REVIEW_ANALYSIS_SYSTEM,
    autopsyPrompt, AUTOPSY_SYSTEM,
    weeklyCoachPrompt, WEEKLY_COACH_SYSTEM,
} from '@/lib/ai/prompts'

// ─── In-memory cache (keyed by agent + hash of context) ──────────────────────
const cache = new Map<string, { value: string; expires: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

// Cached agents — deterministic outputs worth caching
const CACHEABLE_AGENTS = new Set(['goal_cascade', 'task_breakdown', 'schedule'])

function getCached(key: string): string | null {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expires) { cache.delete(key); return null }
    return entry.value
}

function setCached(key: string, value: string) {
    if (cache.size > 500) {
        const first = cache.keys().next().value
        if (first) cache.delete(first)
    }
    cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS })
}

// ─── POST /api/ai ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    // Rate limit: 20 AI requests per minute per IP
    const rl = rateLimit(req, { limit: 20, windowSeconds: 60, prefix: 'ai' })
    if (!rl.success) return rl.response

    try {
        const body = await req.json()
        const { agent, message, context = {} } = body

        if (!agent || !message) {
            return NextResponse.json({ error: 'Missing agent or message' }, { status: 400 })
        }

        // Cache check for deterministic agents
        const cacheKey = CACHEABLE_AGENTS.has(agent) ? `${agent}:${message}` : null
        if (cacheKey) {
            const cached = getCached(cacheKey)
            if (cached) return NextResponse.json({ content: cached, cached: true })
        }

        let systemPrompt = ''
        let userPrompt = message
        let task: AITask = 'weekly_coach'

        // ─── Route to correct DeepSeek model + prompt ─────────────────────
        switch (agent) {
            case 'goal_cascade':
                systemPrompt = GOAL_CASCADE_SYSTEM
                userPrompt = goalCascadePrompt(
                    context.goal || message,
                    context.profileType || 'student',
                    context.timeframe || '3 months'
                )
                task = 'goal_cascade'
                break

            case 'task_breakdown':
            case 'task-breakdown':
                systemPrompt = TASK_BREAKDOWN_SYSTEM
                userPrompt = taskBreakdownPrompt(
                    context.taskTitle || message,
                    context.estimatedMins || 25
                )
                task = 'task_breakdown'
                break

            case 'procrastination':
                systemPrompt = PROCRASTINATION_SYSTEM
                userPrompt = procrastinationPrompt(
                    context.taskTitle || message,
                    context.daysDelayed || 1,
                    context.priority || 2,
                    context.estimatedMins || 25,
                    context.userReason || 'not sure',
                    context.completedPct || 50
                )
                task = 'procrastination'
                break

            case 'schedule':
                systemPrompt = SCHEDULE_SYSTEM
                userPrompt = schedulePrompt(
                    context.tasks || [],
                    context.energyLevel || 3,
                    context.availableHours || 6,
                    context.peakHours || '9:00-12:00'
                )
                task = 'schedule'
                break

            case 'review_analysis':
                systemPrompt = REVIEW_ANALYSIS_SYSTEM
                userPrompt = reviewAnalysisPrompt(context.weekData || {})
                task = 'review_analysis'
                break

            case 'autopsy':
                systemPrompt = AUTOPSY_SYSTEM
                userPrompt = autopsyPrompt(
                    context.goalTitle || message,
                    context.targetDate || '',
                    context.completionPct || 0,
                    context.daysSinceLastAction || 7
                )
                task = 'autopsy'
                break

            case 'planner':
            case 'weekly_coach':
            case 'coach':
            default:
                systemPrompt = WEEKLY_COACH_SYSTEM
                userPrompt = weeklyCoachPrompt(
                    context.name || 'there',
                    context.level || 1,
                    context.score || 0,
                    context.topGoal || message
                )
                task = 'weekly_coach'
                break
        }

        // ─── Call DeepSeek (with Gemini fallback built in) ────────────────
        const content = await routeAI(task, userPrompt, systemPrompt)

        if (cacheKey) setCached(cacheKey, content)

        return NextResponse.json({ content, cached: false })

    } catch (e) {
        console.error('AI route error:', e)
        return NextResponse.json(
            { error: 'AI request failed. Please try again.' },
            { status: 500 }
        )
    }
}
