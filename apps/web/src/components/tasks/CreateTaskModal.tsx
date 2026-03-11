'use client'

import { useState, useEffect } from 'react'
import { TaskPriority, useTaskStore } from '@/stores/taskStore'
import { useGoalStore } from '@/stores/goalStore'
import { X, Target } from 'lucide-react'

const PRIORITIES: TaskPriority[] = ['P1', 'P2', 'P3', 'P4']

export default function CreateTaskModal({ onClose }: { onClose: () => void }) {
    const { addTask } = useTaskStore()
    const { goals, fetchGoals } = useGoalStore()

    const [title, setTitle] = useState('')
    const [priority, setPriority] = useState<TaskPriority>('P3')
    const [estimatedMins, setEstimatedMins] = useState<number>(30)
    const [scheduledDate, setScheduledDate] = useState('')
    const [goalId, setGoalId] = useState<string>('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (goals.length === 0) fetchGoals()
    }, [goals.length, fetchGoals])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!goalId) return

        setLoading(true)

        await addTask({
            goal_id: goalId,
            title,
            priority,
            estimated_mins: estimatedMins,
            status: 'pending',
            scheduled_date: scheduledDate || null
        })

        setLoading(false)
        onClose()
    }

    // Flatten the goals for selection, maybe visually indent them 
    // but for simplicity just listing all active goals.
    const activeGoals = goals.filter(g => g.status === 'active')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white tracking-tight">New Action Item</h2>
                    <button onClick={onClose} title="Close Modal" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Task Title</label>
                        <input
                            type="text"
                            title="Task Title"
                            required
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg font-medium"
                            placeholder="What needs to be done?"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Target className="w-3.5 h-3.5" /> Link to Goal
                        </label>
                        <select
                            required
                            title="Link to Goal"
                            value={goalId}
                            onChange={(e) => setGoalId(e.target.value)}
                            className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                        >
                            <option value="" disabled>Select a parent goal...</option>
                            {activeGoals.map(g => (
                                <option key={g.id} value={g.id}>
                                    {g.level.toUpperCase()} - {g.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Priority</label>
                            <select
                                title="Priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            >
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Est. Mins</label>
                            <input
                                type="number"
                                title="Estimated Minutes"
                                min="5"
                                step="5"
                                value={estimatedMins}
                                onChange={(e) => setEstimatedMins(parseInt(e.target.value))}
                                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Target Date</label>
                            <input
                                type="date"
                                title="Target Date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [color-scheme:dark] text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-gray-400 font-semibold hover:text-white hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !goalId}
                            className="bg-white hover:bg-gray-200 text-gray-900 px-6 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? 'Adding...' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
