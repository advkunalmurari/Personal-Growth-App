'use client'

import { useState } from 'react'
import { GoalLevel, GoalCategory, useGoalStore } from '@/stores/goalStore'
import { X } from 'lucide-react'

// Derived from B.L.A.S.T schema logic
const LEVELS: GoalLevel[] = ['vision', 'yearly', 'half_yearly', 'quarterly', 'monthly', 'weekly', 'daily']
const CATEGORIES: GoalCategory[] = ['study', 'business', 'health', 'skill', 'spiritual', 'personal']

export default function CreateGoalModal({ parentId, onClose }: { parentId: string | null; onClose: () => void }) {
    const { addGoal } = useGoalStore()
    const [title, setTitle] = useState('')
    const [level, setLevel] = useState<GoalLevel>('vision')
    const [category, setCategory] = useState<GoalCategory>('personal')
    const [targetDate, setTargetDate] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        await addGoal({
            parent_goal_id: parentId,
            title,
            level,
            category,
            target_date: targetDate || null,
            status: 'active'
        })

        setLoading(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-white tracking-tight">Construct Target</h2>
                    <button onClick={onClose} title="Close Modal" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Objective Title</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg font-medium"
                            placeholder="E.g., Become a Senior Engineer"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hierarchy Level</label>
                            <select
                                title="Hierarchy Level"
                                value={level}
                                onChange={(e) => setLevel(e.target.value as GoalLevel)}
                                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all capitalize"
                            >
                                {LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                            <select
                                title="Category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                                className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all capitalize"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Target Date (Optional)</label>
                        <input
                            type="date"
                            title="Target Date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [color-scheme:dark]"
                        />
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
                            disabled={loading}
                            className="bg-white hover:bg-gray-200 text-gray-900 px-6 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? 'Initializing...' : 'Define Target'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
