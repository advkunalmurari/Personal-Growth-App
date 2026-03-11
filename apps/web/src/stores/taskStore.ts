import { createClient } from '@/lib/supabase/client'
import { create } from 'zustand'

export type TaskPriority = 'P1' | 'P2' | 'P3' | 'P4'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'skipped'

export interface Task {
    id: string
    goal_id: string
    title: string
    priority: TaskPriority
    estimated_mins: number
    actual_mins: number | null
    status: TaskStatus
    scheduled_date: string | null
    time_block_id: string | null
    xp_value: number
    completed_at: string | null
    created_at: string
    updated_at: string
}

interface TaskState {
    tasks: Task[]
    isLoading: boolean
    error: string | null
    fetchTasks: () => Promise<void>
    addTask: (task: Omit<Task, 'id' | 'actual_mins' | 'time_block_id' | 'xp_value' | 'completed_at' | 'created_at' | 'updated_at'>) => Promise<void>
    updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>
    deleteTask: (id: string) => Promise<void>
}

// XP Calculation Logic
const getBaseXP = (priority: TaskPriority, estimated_mins: number): number => {
    const priorityMultiplier = { P1: 2.0, P2: 1.5, P3: 1.0, P4: 0.5 }[priority]
    const baseXP = Math.floor(estimated_mins / 5) * 5 // 5 XP per 5 mins
    return Math.max(10, Math.floor(baseXP * priorityMultiplier))
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,

    fetchTasks: async () => {
        set({ isLoading: true, error: null })
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Since we rely on RLS, fetching tasks where user owns the goal is handled securely.
            // But we still need to query tasks.
            const { data, error } = await supabase
                .from('tasks')
                .select('*, goals!inner(user_id)')
                .eq('goals.user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            set({ tasks: data as Task[], isLoading: false })
        } catch (e) {
            set({ error: (e as Error).message, isLoading: false })
        }
    },

    addTask: async (newTaskData) => {
        try {
            const supabase = createClient()

            const xp_value = getBaseXP(newTaskData.priority, newTaskData.estimated_mins || 30)

            const payload = {
                ...newTaskData,
                xp_value
            }

            const { data, error } = await supabase
                .from('tasks')
                .insert(payload)
                .select()
                .single()

            if (error) throw error

            set((state) => ({ tasks: [data as Task, ...state.tasks] }))
        } catch (e) {
            set({ error: (e as Error).message })
        }
    },

    updateTaskStatus: async (id, status) => {
        const originalTasks = get().tasks

        // Optimistic Update
        set((state) => ({
            tasks: state.tasks.map((t) => t.id === id ? {
                ...t,
                status,
                completed_at: status === 'completed' ? new Date().toISOString() : null
            } : t)
        }))

        try {
            const supabase = createClient()

            const payload: Record<string, string | null> = { status }
            if (status === 'completed') {
                payload.completed_at = new Date().toISOString()
            } else if (status === 'pending' || status === 'in_progress') {
                payload.completed_at = null
            }

            const { error } = await supabase
                .from('tasks')
                .update(payload)
                .eq('id', id)

            if (error) throw error

            // If completed, we should ideally trigger a user XP increment via RPC or edge function
            // For now, it's just recorded on the task.

        } catch (e) {
            set({ error: (e as Error).message, tasks: originalTasks })
        }
    },

    deleteTask: async (id) => {
        const originalTasks = get().tasks
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))

        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (e) {
            set({ error: (e as Error).message, tasks: originalTasks })
        }
    }
}))
