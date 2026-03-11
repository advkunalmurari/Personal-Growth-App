'use client'

import { useEffect, useState } from 'react'
import { Plus, ListTodo, Activity } from 'lucide-react'
import { useTaskStore } from '@/stores/taskStore'
import TaskCard from '@/components/tasks/TaskCard'
import CreateTaskModal from '@/components/tasks/CreateTaskModal'

export default function TasksPage() {
    const { tasks, fetchTasks, isLoading, error } = useTaskStore()
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchTasks()
    }, [fetchTasks])

    // Filter and split tasks
    const pendingTasks = tasks.filter(t => t.status !== 'completed')
    const completedTasks = tasks.filter(t => t.status === 'completed')

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-end justify-between mb-10">
                <div>
                    <div className="flex items-center gap-3 text-indigo-400 mb-2">
                        <ListTodo className="w-5 h-5" />
                        <h2 className="font-semibold tracking-wider text-sm uppercase">Tasks & Execution</h2>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                        Daily Workflow
                    </h1>
                    <p className="text-gray-400">
                        Execute the microscopic steps that compound into macroscopic victory.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-400 hover:to-fuchsia-400 text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all transform hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4 bg-gray-900/40 border border-gray-800/60 rounded-3xl">
                        <Activity className="w-8 h-8 animate-pulse text-indigo-500" />
                        <p className="animate-pulse">Loading execution layer...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
                        Failed to load tasks: {error}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center max-w-md mx-auto bg-gray-900/40 border border-gray-800/60 rounded-3xl p-6">
                        <div className="w-16 h-16 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-6">
                            <ListTodo className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Zero Active Tasks</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Every grand vision requires foundational action. Break down your goals into actionable P1-P4 tasks.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Create First Task
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Active Tasks Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                                Action Queue
                                <span className="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
                            </h3>
                            <div className="space-y-3">
                                {pendingTasks.map(task => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                                {pendingTasks.length === 0 && (
                                    <div className="text-center py-8 border border-dashed border-gray-800 rounded-2xl text-gray-500">
                                        All clear. You have zero pending tasks in the queue.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Completed Tasks Section */}
                        {completedTasks.length > 0 && (
                            <div className="pt-4 opacity-70">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
                                    Completed Today
                                </h3>
                                <div className="space-y-3">
                                    {completedTasks.map(task => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {isModalOpen && <CreateTaskModal onClose={() => setIsModalOpen(false)} />}
        </div>
    )
}
