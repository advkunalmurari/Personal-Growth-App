import { createClient } from '@/lib/supabase/client'
import { create } from 'zustand'

// Define the core types according to our database schema
export type GoalLevel = 'vision' | 'yearly' | 'half_yearly' | 'quarterly' | 'monthly' | 'weekly' | 'daily'
export type GoalCategory = 'study' | 'business' | 'health' | 'skill' | 'spiritual' | 'personal'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived'
export type VelocityStatus = 'on_track' | 'at_risk' | 'behind'

export interface Goal {
    id: string
    user_id: string
    parent_goal_id: string | null
    title: string
    level: GoalLevel
    category: GoalCategory
    status: GoalStatus
    progress_pct: number
    target_date: string | null
    velocity_status: VelocityStatus
    created_at: string
    updated_at: string
    children?: Goal[] // For hierarchical rendering
}

interface GoalState {
    goals: Goal[]
    isLoading: boolean
    error: string | null
    fetchGoals: () => Promise<void>
    addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'progress_pct' | 'velocity_status'>) => Promise<void>
    updateGoalStatus: (id: string, status: GoalStatus) => Promise<void>
    deleteGoal: (id: string) => Promise<void>
}

export const useGoalStore = create<GoalState>((set, get) => ({
    goals: [],
    isLoading: false,
    error: null,

    fetchGoals: async () => {
        set({ isLoading: true, error: null })
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: true })

            if (error) throw error

            set({ goals: data as Goal[], isLoading: false })
        } catch (e) {
            set({ error: (e as Error).message, isLoading: false })
        }
    },

    addGoal: async (newGoalData) => {
        // Optimistic UI update logic can be enhanced, keeping simple for now
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const payload = {
                ...newGoalData,
                user_id: user.id
            }

            const { data, error } = await supabase
                .from('goals')
                .insert(payload)
                .select()
                .single()

            if (error) throw error

            set((state) => ({ goals: [...state.goals, data as Goal] }))
        } catch (e) {
            set({ error: (e as Error).message })
        }
    },

    updateGoalStatus: async (id, status) => {
        // Optimistic update
        set((state) => ({
            goals: state.goals.map((g) => g.id === id ? { ...g, status } : g)
        }))

        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('goals')
                .update({ status })
                .eq('id', id)

            if (error) {
                // Rollback
                get().fetchGoals()
                throw error
            }
        } catch (e) {
            set({ error: (e as Error).message })
        }
    },

    deleteGoal: async (id) => {
        // Optimistic delete
        set((state) => ({
            goals: state.goals.filter((g) => g.id !== id)
        }))

        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', id)

            if (error) {
                // Rollback
                get().fetchGoals()
                throw error
            }
        } catch (e) {
            set({ error: (e as Error).message })
        }
    }
}))
