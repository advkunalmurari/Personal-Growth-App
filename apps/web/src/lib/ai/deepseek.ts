import OpenAI from 'openai'

// ─── DeepSeek client (OpenAI-compatible API) ──────────────────────────────────
// DeepSeek API is 95% cheaper than GPT-4o and has lower latency from India
const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
})

// ─── Model definitions ────────────────────────────────────────────────────────
// deepseek-chat  = DeepSeek-V3: fast, structured output, JSON-mode, 128K context
// deepseek-reasoner = DeepSeek-R1: chain-of-thought, o1-comparable reasoning

export type AITask =
    | 'goal_cascade'
    | 'task_breakdown'
    | 'review_analysis'
    | 'procrastination'
    | 'schedule'
    | 'voice_parse'
    | 'autopsy'
    | 'weekly_coach'

const MODEL_ROUTE: Record<AITask, { model: string; requiresJSON: boolean }> = {
    goal_cascade: { model: 'deepseek-chat', requiresJSON: true },
    task_breakdown: { model: 'deepseek-chat', requiresJSON: true },
    schedule: { model: 'deepseek-chat', requiresJSON: true },
    voice_parse: { model: 'deepseek-chat', requiresJSON: true },
    weekly_coach: { model: 'deepseek-chat', requiresJSON: false },
    review_analysis: { model: 'deepseek-reasoner', requiresJSON: true },
    procrastination: { model: 'deepseek-reasoner', requiresJSON: true },
    autopsy: { model: 'deepseek-reasoner', requiresJSON: true },
}

// ─── Multi-model router ───────────────────────────────────────────────────────
export async function routeAI(
    task: AITask,
    prompt: string,
    systemPrompt: string,
    maxTokens = 1000
): Promise<string> {
    const route = MODEL_ROUTE[task]

    try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ]

        // DeepSeek-R1 (reasoner) uses a different API format
        if (route.model === 'deepseek-reasoner') {
            const res = await deepseek.chat.completions.create({
                model: 'deepseek-reasoner',
                messages,
                max_tokens: maxTokens,
            })
            return res.choices[0].message.content || ''
        }

        // DeepSeek-V3 (chat) with optional JSON mode
        const res = await deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages,
            max_tokens: maxTokens,
            ...(route.requiresJSON
                ? { response_format: { type: 'json_object' } }
                : {}),
        })
        return res.choices[0].message.content || ''

    } catch (err) {
        // Fallback: try Gemini via the existing Google GenAI SDK
        console.warn(`DeepSeek failed for task "${task}", falling back to Gemini:`, err)
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(
            `${systemPrompt}\n\n${prompt}`
        )
        return result.response.text()
    }
}

// ─── Health check ─────────────────────────────────────────────────────────────
export async function pingDeepSeek(): Promise<boolean> {
    try {
        await deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 5,
        })
        return true
    } catch {
        return false
    }
}
