'use client'

import { useState } from 'react'
import { Wand2, Loader2, Plus, AlertCircle } from 'lucide-react'

interface SubTask {
    title: string
    estimatedMins: number
    priority: 'P1' | 'P2' | 'P3' | 'P4'
}

interface TaskBreakdownEngineProps {
    onAddTask?: (task: SubTask) => void
}

const priorityColors: Record<string, string> = {
    P1: 'text-red-400 bg-red-400/10 border-red-400/20',
    P2: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    P3: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    P4: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
}

export default function TaskBreakdownEngine({ onAddTask }: TaskBreakdownEngineProps) {
    const [goal, setGoal] = useState('')
    const [tasks, setTasks] = useState<SubTask[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const breakdown = async () => {
        if (!goal.trim()) return
        setIsLoading(true)
        setError(null)
        setTasks([])

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'task-breakdown',
                    context: {},
                    message: `Break down this goal into subtasks: "${goal}"`
                })
            })

            const data = await res.json()

            // Parse JSON response from AI
            const jsonStr = data.response?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const parsed = JSON.parse(jsonStr)
            setTasks(Array.isArray(parsed) ? parsed : [])
        } catch {
            setError('Could not parse AI response. Make sure your GEMINI_API_KEY is set in .env.local')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-purple-600/10 to-fuchsia-600/10">
                <div className="flex items-center gap-2.5 mb-1">
                    <Wand2 className="w-5 h-5 text-fuchsia-400" />
                    <h2 className="font-semibold text-white">AI Task Breakdown Engine</h2>
                </div>
                <p className="text-xs text-slate-400">Describe a goal and AI will generate concrete, prioritized subtasks</p>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex gap-2">
                    <input
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && breakdown()}
                        placeholder="e.g. Launch my SaaS product MVP in 30 days..."
                        aria-label="Goal to break down"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all"
                    />
                    <button
                        onClick={breakdown}
                        disabled={!goal.trim() || isLoading}
                        title="Break down this goal"
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {isLoading ? 'Generating...' : 'Break Down'}
                    </button>
                </div>

                {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {tasks.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Generated Tasks ({tasks.length})</p>
                        <div className="space-y-2">
                            {tasks.map((task, i) => (
                                <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={`text-[11px] font-bold border px-1.5 py-0.5 rounded flex-shrink-0 ${priorityColors[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-sm text-slate-200 truncate">{task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs text-slate-500">{task.estimatedMins}m</span>
                                        {onAddTask && (
                                            <button
                                                onClick={() => onAddTask(task)}
                                                title={`Add "${task.title}" as a task`}
                                                className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
