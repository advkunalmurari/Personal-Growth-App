'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, Flame, MoreHorizontal } from 'lucide-react'
import { Task, TaskStatus, useTaskStore } from '@/stores/taskStore'
import clsx from 'clsx'

const priorityColors: Record<Task['priority'], string> = {
    P1: 'bg-red-500/10 text-red-400 border-red-500/20',
    P2: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    P3: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    P4: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default function TaskCard({ task }: { task: Task }) {
    const { updateTaskStatus } = useTaskStore()
    const [isUpdating, setIsUpdating] = useState(false)

    const toggleStatus = async () => {
        if (isUpdating) return
        setIsUpdating(true)
        const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
        await updateTaskStatus(task.id, newStatus)
        setIsUpdating(false)
    }

    const isCompleted = task.status === 'completed'

    return (
        <div className={clsx(
            "group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
            isCompleted
                ? "bg-gray-900/40 border-gray-800/40 opacity-60 hover:opacity-100"
                : "bg-gray-900/60 border-gray-800 hover:border-indigo-500/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]"
        )}>
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                    onClick={toggleStatus}
                    disabled={isUpdating}
                    className={clsx(
                        "flex-shrink-0 transition-colors duration-200",
                        isCompleted ? "text-indigo-400" : "text-gray-500 hover:text-indigo-400"
                    )}
                >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>

                <div className="flex-1 min-w-0">
                    <p className={clsx(
                        "font-semibold text-base truncate transition-all duration-300",
                        isCompleted ? "text-gray-500 line-through decoration-gray-600" : "text-gray-100"
                    )}>
                        {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 opacity-80">
                        <span className={clsx("text-[10px] uppercase font-bold px-2 py-0.5 rounded border", priorityColors[task.priority])}>
                            {task.priority}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.estimated_mins}m</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-fuchsia-400">
                            <Flame className="w-3.5 h-3.5" />
                            <span>+{task.xp_value} XP</span>
                        </div>
                        {task.scheduled_date && (
                            <span className="text-xs text-indigo-300 ml-auto bg-indigo-500/10 px-2 rounded">
                                Due {new Date(task.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                <button title="Task Options" className="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
