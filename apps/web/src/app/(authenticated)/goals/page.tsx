'use client'

import { useEffect, useState } from 'react'
import { Plus, Target, Activity } from 'lucide-react'
import { useGoalStore } from '@/stores/goalStore'
import GoalTree from '@/components/goals/GoalTree'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import GoalTreeSkeleton from '@/components/goals/GoalTreeSkeleton'

export default function GoalsPage() {
    const { goals, fetchGoals, isLoading, error } = useGoalStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null)

    useEffect(() => {
        fetchGoals()
    }, [fetchGoals])

    // Build the tree structure natively from flat list
    const rootGoals = goals.filter(g => !g.parent_goal_id)

    const handleOpenModal = (parentId: string | null = null) => {
        setSelectedParentId(parentId)
        setIsModalOpen(true)
    }

    return (
        <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-end justify-between mb-10">
                <div>
                    <div className="flex items-center gap-3 text-indigo-400 mb-2">
                        <Target className="w-5 h-5" />
                        <h2 className="font-semibold tracking-wider text-sm uppercase">Goal Engine</h2>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                        Trajectory Map
                    </h1>
                    <p className="text-gray-400">
                        Design your recursive goal hierarchy. Convert vision into daily action.
                    </p>
                </div>

                <button
                    onClick={() => handleOpenModal(null)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    New Vision Goal
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gray-900/40 border border-gray-800/60 rounded-3xl p-6 backdrop-blur-sm overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <GoalTreeSkeleton />
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                        Failed to load goals: {error}
                    </div>
                ) : rootGoals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-6">
                            <Target className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Blank Canvas</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Your goal hierarchy forms the backbone of the operating system. Start by defining a long-term Vision, then construct the cascade downwards.
                        </p>
                        <button
                            onClick={() => handleOpenModal(null)}
                            className="px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Define North Star
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {rootGoals.map(goal => (
                            <GoalTree
                                key={goal.id}
                                goal={goal}
                                allGoals={goals}
                                onAddSubGoal={handleOpenModal}
                                depth={0}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isModalOpen && (
                <CreateGoalModal
                    parentId={selectedParentId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}
