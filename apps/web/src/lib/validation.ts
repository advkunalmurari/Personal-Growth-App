import { z, ZodSchema, ZodError } from 'zod'
import { NextResponse } from 'next/server'

// ─── Common validation schemas ────────────────────────────────────────────────

export const schemas = {
    // AI Coach
    aiRequest: z.object({
        agent: z.enum(['coach', 'task-breakdown', 'feedback', 'planner']),
        message: z.string().min(1).max(2000),
        context: z.record(z.unknown()).optional(),
    }),

    // XP Award
    xpRequest: z.object({
        action: z.enum([
            'task_complete', 'task_complete_on_time', 'habit_logged',
            'habit_streak_7', 'habit_streak_30', 'habit_streak_100',
            'focus_session_25min', 'focus_session_90min',
            'goal_milestone', 'review_completed', 'first_win_of_day',
        ]),
        metadata: z.record(z.unknown()).optional(),
    }),

    // Checkout
    checkoutRequest: z.object({
        plan_id: z.enum(['pro_monthly', 'pro_yearly', 'team_monthly']).optional(),
        action: z.enum(['verify']).optional(),
        razorpay_payment_id: z.string().optional(),
        razorpay_order_id: z.string().optional(),
        razorpay_signature: z.string().optional(),
    }),

    // Push notification
    pushRequest: z.object({
        target: z.union([
            z.literal('self'),
            z.object({ user_ids: z.array(z.string().uuid()) }),
        ]),
        title: z.string().min(1).max(100),
        message: z.string().min(1).max(500),
        type: z.enum(['default', 'reminder']).optional(),
        data: z.record(z.string()).optional(),
    }),

    // Task creation
    taskCreate: z.object({
        title: z.string().min(1).max(200).trim(),
        description: z.string().max(2000).optional(),
        priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
        scheduled_date: z.string().datetime().optional(),
        estimated_mins: z.number().int().min(1).max(480).optional(),
        goal_id: z.string().uuid().optional(),
    }),

    // Profile update
    profileUpdate: z.object({
        name: z.string().min(1).max(100).trim().optional(),
        bio: z.string().max(500).optional(),
        phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
        timezone: z.string().optional(),
    }),
}

// ─── Validation Helper ────────────────────────────────────────────────────────

/**
 * Parses and validates a request body against a Zod schema.
 * Returns `{ data }` on success or `{ error, response }` on failure.
 */
export async function validateBody<T>(
    req: Request,
    schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
    try {
        const json = await req.json()
        const data = schema.parse(json)
        return { data }
    } catch (err) {
        if (err instanceof ZodError) {
            const issues = err.issues.map(i => ({
                field: i.path.join('.'),
                message: i.message,
            }))
            return {
                error: NextResponse.json(
                    { error: 'Validation failed', issues },
                    { status: 400 }
                ),
            }
        }
        return {
            error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
        }
    }
}

// Re-export zod for convenience
export { z }
