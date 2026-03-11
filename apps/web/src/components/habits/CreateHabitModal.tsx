'use client'

import { useState } from 'react'
import { HabitFrequency, useHabitStore } from '@/stores/habitStore'
import { X, Flame } from 'lucide-react'

export default function CreateHabitModal({ onClose }: { onClose: () => void }) {
    const { addHabit } = useHabitStore()

    const [name, setName] = useState('')
    const [frequency, setFrequency] = useState<HabitFrequency>('daily')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        await addHabit(name, frequency)

        setLoading(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-fuchsia-500" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Forge New Habit</h2>
                    </div>
                    <button onClick={onClose} title="Close Modal" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors text-sm font-medium">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Habit Name</label>
                        <input
                            type="text"
                            title="Habit Name"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all text-lg font-medium"
                            placeholder="e.g. Read 10 Pages, Meditate code"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Frequency</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['daily', 'weekdays', 'custom'] as HabitFrequency[]).map(freq => (
                                <button
                                    key={freq}
                                    type="button"
                                    onClick={() => setFrequency(freq)}
                                    className={`px-4 py-3 rounded-xl border text-sm font-semibold capitalize transition-all ${frequency === freq
                                        ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-400'
                                        : 'bg-gray-950/50 border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
                                        }`}
                                >
                                    {freq}
                                </button>
                            ))}
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
                            disabled={loading || !name}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                            {loading ? 'Forging...' : 'Forge Habit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
