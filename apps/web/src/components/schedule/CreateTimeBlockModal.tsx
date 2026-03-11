'use client'

import { useState } from 'react'
import { Plus, X, Clock } from 'lucide-react'
import { useTimeBlockStore, BlockType } from '@/stores/timeBlockStore'
import { useTaskStore } from '@/stores/taskStore'
import clsx from 'clsx'

export default function CreateTimeBlockModal({ onClose, selectedDate, prefilledHour }: { onClose: () => void, selectedDate: string, prefilledHour?: string }) {
    const { createBlock } = useTimeBlockStore()
    const { tasks } = useTaskStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const pendingTasks = tasks.filter(t => t.status !== 'completed')

    const [formData, setFormData] = useState({
        start_time: prefilledHour || '09:00',
        end_time: prefilledHour ? `${parseInt(prefilledHour.split(':')[0]) + 1}:00`.padStart(5, '0') : '10:00',
        block_type: 'deep_work' as BlockType,
        task_id: ''
    })

    // Set default title based on block type if no task selected
    const blockTypeTitles: Record<BlockType, string> = {
        deep_work: 'Deep Work Session',
        study: 'Study & Learning',
        business: 'Business Operations',
        exercise: 'Physical Training',
        skill_dev: 'Skill Development',
        spiritual: 'Spiritual Practice',
        admin: 'Admin & Logistics'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        try {
            if (formData.start_time >= formData.end_time) {
                throw new Error("End time must be after start time")
            }

            await createBlock({
                date: selectedDate,
                start_time: `${formData.start_time}:00`,
                end_time: `${formData.end_time}:00`,
                block_type: formData.block_type,
                task_id: formData.task_id || null,
                focus_score: null
            })
            onClose()
        } catch (err) {
            setError((err as Error).message)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between p-6 border-b border-gray-800/60 relative z-10">
                    <div className="flex items-center gap-3 text-indigo-400">
                        <Clock className="w-5 h-5" />
                        <h2 className="text-xl font-bold text-white">Allocate Time Block</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors" title="Close modal">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Start Time</label>
                            <input
                                type="time"
                                title="Start Time"
                                required
                                value={formData.start_time}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">End Time</label>
                            <input
                                type="time"
                                title="End Time"
                                required
                                value={formData.end_time}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Block Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(blockTypeTitles) as BlockType[]).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, block_type: type })}
                                    className={clsx(
                                        "px-2 py-2 text-xs font-semibold rounded-lg border transition-all text-center capitalize",
                                        formData.block_type === type
                                            ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                                            : "bg-gray-800/30 border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                                    )}
                                >
                                    {type.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Link to Task (Optional)</label>
                        <select
                            value={formData.task_id}
                            onChange={e => setFormData({ ...formData, task_id: e.target.value })}
                            className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
                            title="Select Task to Link"
                        >
                            <option value="">-- No specific task --</option>
                            {pendingTasks.map(task => (
                                <option key={task.id} value={task.id}>
                                    {task.title} ({task.estimated_mins}m)
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-5 h-5" /> Allot Block
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
