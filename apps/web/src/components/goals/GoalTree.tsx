'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Plus } from 'lucide-react'
import { Goal } from '@/stores/goalStore'
import clsx from 'clsx'

const levelColors: Record<Goal['level'], string> = {
    vision: 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400',
    yearly: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
    half_yearly: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    quarterly: 'border-teal-500/50 bg-teal-500/10 text-teal-400',
    monthly: 'border-green-500/50 bg-green-500/10 text-green-400',
    weekly: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    daily: 'border-orange-500/50 bg-orange-500/10 text-orange-400',
}

export default function GoalTree({
    goal,
    allGoals,
    onAddSubGoal,
    depth
}: {
    goal: Goal;
    allGoals: Goal[];
    onAddSubGoal: (parentId: string) => void;
    depth: number;
}) {
    const [isExpanded, setIsExpanded] = useState(true)
    const children = allGoals.filter(g => g.parent_goal_id === goal.id)

    const progressBg = goal.progress_pct >= 80 ? 'bg-green-500' : goal.progress_pct >= 50 ? 'bg-amber-500' : 'bg-red-500'

    return (
        <div className="flex flex-col">
            <div
                className={clsx(
                    "flex items-center gap-4 bg-gray-900/60 border border-gray-800 p-4 rounded-xl transition-all hover:bg-gray-800/80 group",
                    depth > 0 && "ml-8 mt-3"
                )}
            >
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={clsx(
                        "p-1 rounded-md hover:bg-gray-700 text-gray-500 transition-colors",
                        children.length === 0 && "opacity-0 cursor-default"
                    )}
                    disabled={children.length === 0}
                >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3">
                            <span className={clsx("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border", levelColors[goal.level])}>
                                {goal.level.replace('_', ' ')}
                            </span>
                            <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded-md capitalize">
                                {goal.category}
                            </span>
                            {goal.target_date && (
                                <span className="text-gray-400 text-xs font-mono">🎯 {new Date(goal.target_date).toLocaleDateString()}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onAddSubGoal(goal.id)}
                                className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Child
                            </button>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-100 truncate w-full pr-4">{goal.title}</h3>

                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className={clsx("h-full transition-all duration-500 ease-out", progressBg)} style={{ width: `${goal.progress_pct}%` }} />
                        </div>
                        <span className="text-xs font-mono text-gray-400 w-9 text-right">{goal.progress_pct}%</span>
                    </div>
                </div>
            </div>

            {isExpanded && children.length > 0 && (
                <div className="relative border-l-2 border-gray-800/60 ml-[35px]">
                    {children.map(child => (
                        <GoalTree
                            key={child.id}
                            goal={child}
                            allGoals={allGoals}
                            onAddSubGoal={onAddSubGoal}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
