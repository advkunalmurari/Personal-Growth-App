import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('audio') as File | null
        const context = formData.get('context') as string | null

        if (!file) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer()
        const base64Audio = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = (file.type as 'audio/webm' | 'audio/mp4' | 'audio/wav') || 'audio/webm'

        // Use Gemini's multimodal capability to transcribe and interpret voice
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        const systemPrompt = context
            ? `The user is speaking a command or query to their Life OS dashboard. \nUser context: ${context}\nTranscribe their voice and then interpret it as a task/goal/command for their life system.\nRespond with JSON: { transcription: string, intent: 'add_task'|'add_goal'|'ask_coach'|'schedule_block'|'general', data: object, coaching_reply: string }`
            : `Transcribe the following audio and return the text.`

        const result = await model.generateContent([
            { text: systemPrompt },
            {
                inlineData: {
                    mimeType,
                    data: base64Audio,
                }
            }
        ])

        const responseText = result.response.text()

        // Try to parse JSON if context was provided (intent detection mode)
        if (context) {
            try {
                // Strip markdown fences if present
                const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                const parsed = JSON.parse(cleaned)
                return NextResponse.json(parsed)
            } catch {
                // Fall back to raw transcription
                return NextResponse.json({ transcription: responseText, intent: 'general', data: {}, coaching_reply: responseText })
            }
        }

        return NextResponse.json({ transcription: responseText })

    } catch (e) {
        console.error('Voice API error:', e)
        return NextResponse.json({ error: 'Voice processing failed' }, { status: 500 })
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
}
