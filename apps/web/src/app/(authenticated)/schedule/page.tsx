'use client'

import { useEffect, useState } from 'react'
import { Plus, Clock, ChevronLeft, ChevronRight, Activity, X } from 'lucide-react'
import { useTimeBlockStore, BlockType } from '@/stores/timeBlockStore'
import { useTaskStore } from '@/stores/taskStore'
import CreateTimeBlockModal from '@/components/schedule/CreateTimeBlockModal'
import clsx from 'clsx'

const blockColors: Record<BlockType, string> = {
    deep_work: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
    study: 'bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-300',
    business: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    exercise: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
    skill_dev: 'bg-green-500/20 border-green-500/30 text-green-300',
    spiritual: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    admin: 'bg-gray-500/20 border-gray-500/30 text-gray-300'
}

export default function SchedulePage() {
    const { blocks, fetchBlocks, isLoading, deleteBlock } = useTimeBlockStore()
    const { tasks, fetchTasks } = useTaskStore()

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [prefilledHour, setPrefilledHour] = useState<string | undefined>()

    useEffect(() => {
        fetchBlocks(selectedDate)
        fetchTasks() // To get linked task names
    }, [fetchBlocks, fetchTasks, selectedDate])

    // Simple day navigation
    const prevDay = () => {
        const d = new Date(selectedDate)
        d.setDate(d.getDate() - 1)
        setSelectedDate(d.toISOString().split('T')[0])
    }
    const nextDay = () => {
        const d = new Date(selectedDate)
        d.setDate(d.getDate() + 1)
        setSelectedDate(d.toISOString().split('T')[0])
    }
    const today = () => {
        setSelectedDate(new Date().toISOString().split('T')[0])
    }

    // Generate 24 hour blocks for the timeline
    const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        label: `${i === 0 ? 12 : i > 12 ? i - 12 : i} ${i >= 12 ? 'PM' : 'AM'}`
    }))

    const handleTimelineClick = (hour: number) => {
        setPrefilledHour(`${hour.toString().padStart(2, '0')}:00`)
        setIsModalOpen(true)
    }

    // Calculate position and height of blocks based on time
    const getBlockStyle = (startTime: string, endTime: string) => {
        const parseTime = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number)
            return h + m / 60
        }
        const start = parseTime(startTime)
        const end = parseTime(endTime)
        const duration = end - start

        return {
            top: `${(start / 24) * 100}%`,
            height: `${(duration / 24) * 100}%`,
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 text-indigo-400 mb-2">
                        <Clock className="w-5 h-5" />
                        <h2 className="font-semibold tracking-wider text-sm uppercase">Time Engine</h2>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                        Daily Scheduler
                    </h1>
                    <p className="text-gray-400">
                        Allocate your capital. Protect your deep work focus.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Date Navigator */}
                    <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1">
                        <button onClick={prevDay} title="Previous Day" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={today} className="px-4 font-semibold text-sm text-gray-200">
                            {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </button>
                        <button onClick={nextDay} title="Next Day" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => { setPrefilledHour(undefined); setIsModalOpen(true) }}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        New Block
                    </button>
                </div>
            </div>

            {/* Visual Timeline Area */}
            <div className="flex-1 bg-gray-900/40 border border-gray-800/60 rounded-3xl overflow-hidden flex relative custom-scrollbar overflow-y-auto">

                {/* Time Labels */}
                <div className="w-20 flex-shrink-0 border-r border-gray-800 relative" style={{ height: '1440px' }}>
                    {hours.map(({ hour, label }) => (
                        <div key={hour} className="absolute w-full pr-4 text-right transform -translate-y-1/2" style={{ top: `${(hour / 24) * 100}%` }}>
                            <span className="text-xs font-medium text-gray-500">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Timeline Tracks */}
                <div className="flex-1 relative" style={{ height: '1440px' }}>
                    {/* Grid Lines */}
                    {hours.map(({ hour }) => (
                        <div
                            key={hour}
                            onClick={() => handleTimelineClick(hour)}
                            className="absolute w-full border-t border-gray-800/50 hover:bg-gray-800/30 cursor-crosshair transition-colors"
                            style={{ top: `${(hour / 24) * 100}%`, height: `${(1 / 24) * 100}%` }}
                        />
                    ))}

                    {/* Current Time Indicator (only show if today) */}
                    {selectedDate === new Date().toISOString().split('T')[0] && (
                        <div
                            className="absolute w-full flex items-center z-20 pointer-events-none transform -translate-y-1/2"
                            style={{ top: `${((new Date().getHours() + new Date().getMinutes() / 60) / 24) * 100}%` }}
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                            <div className="flex-1 border-t-2 border-red-500/50" />
                        </div>
                    )}

                    {/* Allocated Blocks */}
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/20 backdrop-blur-sm z-30">
                            <Activity className="w-8 h-8 animate-pulse text-indigo-500" />
                        </div>
                    ) : (
                        blocks.map(block => {
                            const style = getBlockStyle(block.start_time, block.end_time)
                            const linkedTask = block.task_id ? tasks.find(t => t.id === block.task_id) : null

                            return (
                                <div
                                    key={block.id}
                                    className={clsx(
                                        "absolute left-4 right-8 rounded-xl border p-3 flex flex-col overflow-hidden group shadow-lg transition-all hover:z-10",
                                        blockColors[block.block_type]
                                    )}
                                    style={style}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold text-sm truncate">
                                            {block.block_type.replace('_', ' ').toUpperCase()}
                                        </div>
                                        <div className="text-xs font-mono opacity-60 flex-shrink-0">
                                            {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                                        </div>
                                    </div>
                                    {linkedTask && (
                                        <div className="mt-1 text-sm font-medium opacity-90 truncate">
                                            {linkedTask.title}
                                        </div>
                                    )}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                        title="Delete Time Block"
                                        className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )
                        })
                    )}

                </div>
            </div>

            {isModalOpen && <CreateTimeBlockModal selectedDate={selectedDate} prefilledHour={prefilledHour} onClose={() => setIsModalOpen(false)} />}
        </div>
    )
}
