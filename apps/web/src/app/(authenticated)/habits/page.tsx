'use client'

import { useEffect, useState } from 'react'
import { Plus, Flame, Activity } from 'lucide-react'
import { useHabitStore } from '@/stores/habitStore'
import HabitCard from '@/components/habits/HabitCard'
import CreateHabitModal from '@/components/habits/CreateHabitModal'

export default function HabitsPage() {
    const { habits, fetchHabits, isLoading, error } = useHabitStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchHabits()
    }, [fetchHabits])

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-end justify-between mb-10">
                <div>
                    <div className="flex items-center gap-3 text-fuchsia-400 mb-2">
                        <Flame className="w-5 h-5" />
                        <h2 className="font-semibold tracking-wider text-sm uppercase">Core Loop</h2>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                        Habit Tracker
                    </h1>
                    <p className="text-gray-400">
                        Automate behavior. Build consistency. Forge discipline.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    New Habit
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4 bg-gray-900/40 border border-gray-800/60 rounded-3xl">
                        <Activity className="w-8 h-8 animate-pulse text-fuchsia-500" />
                        <p className="animate-pulse">Loading core loop data...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                        Failed to load habits: {error}
                    </div>
                ) : habits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center max-w-md mx-auto bg-gray-900/40 border border-gray-800/60 rounded-3xl p-6">
                        <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-6">
                            <Flame className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Zero Habits Tracked</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Discipline equals freedom. Start by forging your first daily habit to compound your success over time.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Forge First Habit
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {habits.map(habit => (
                            <HabitCard key={habit.id} habit={habit} />
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && <CreateHabitModal onClose={() => setIsModalOpen(false)} />}
        </div>
    )
}
