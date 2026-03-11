import { createClient } from '@/lib/supabase/client'
import { create } from 'zustand'

export type HabitFrequency = 'daily' | 'weekdays' | 'custom'

export interface Habit {
    id: string
    name: string
    frequency: HabitFrequency
    days_of_week: number[] | null
    current_streak: number
    longest_streak: number
    created_at: string
    updated_at: string
}

export interface HabitLog {
    id: string
    habit_id: string
    completed_on: string
    note: string | null
}

interface HabitState {
    habits: Habit[]
    logs: HabitLog[]
    isLoading: boolean
    error: string | null

    fetchHabits: () => Promise<void>
    addHabit: (name: string, frequency: HabitFrequency) => Promise<void>
    toggleHabitLog: (habitId: string, dateStr: string) => Promise<void>
    deleteHabit: (id: string) => Promise<void>
}

export const useHabitStore = create<HabitState>((set, get) => ({
    habits: [],
    logs: [],
    isLoading: false,
    error: null,

    fetchHabits: async () => {
        set({ isLoading: true, error: null })
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Fetch habits
            const { data: habitsData, error: habitsError } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })

            if (habitsError) throw habitsError

            // Fetch all logs for these habits (limit to last 365 days for perf if needed, but fetch all for now)
            const { data: logsData, error: logsError } = await supabase
                .from('habit_logs')
                .select('*')
            // We only fetch logs where habit belongs to user (RLS handles this automatically)

            if (logsError) throw logsError

            set({
                habits: habitsData as Habit[],
                logs: logsData as HabitLog[],
                isLoading: false
            })
        } catch (e) {
            set({ error: (e as Error).message, isLoading: false })
        }
    },

    addHabit: async (name, frequency) => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('habits')
                .insert({
                    user_id: user.id,
                    name,
                    frequency,
                    current_streak: 0,
                    longest_streak: 0
                })
                .select()
                .single()

            if (error) throw error
            set((state) => ({ habits: [...state.habits, data as Habit] }))
        } catch (e) {
            set({ error: (e as Error).message })
        }
    },

    deleteHabit: async (id) => {
        const originalHabits = get().habits
        set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }))

        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('habits')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (e) {
            set({ error: (e as Error).message, habits: originalHabits })
        }
    },

    toggleHabitLog: async (habitId, dateStr) => {
        const state = get()
        const supabase = createClient()

        // Check if log exists for this date
        const existingLog = state.logs.find(l => l.habit_id === habitId && l.completed_on === dateStr)
        const habit = state.habits.find(h => h.id === habitId)
        if (!habit) return

        // Optimistic Update
        if (existingLog) {
            // Remove log
            set((state) => ({
                logs: state.logs.filter(l => l.id !== existingLog.id),
                habits: state.habits.map(h =>
                    h.id === habitId
                        ? { ...h, current_streak: Math.max(0, h.current_streak - 1) }
                        : h
                )
            }))

            try {
                await supabase.from('habit_logs').delete().eq('id', existingLog.id)
                await supabase.from('habits').update({
                    current_streak: Math.max(0, habit.current_streak - 1)
                }).eq('id', habitId)
            } catch (e) {
                // Rollback on fail
                set({ logs: state.logs, habits: state.habits, error: (e as Error).message })
            }
        } else {
            // Add log
            // Temporary optimistic ID
            const tempId = `temp-${Date.now()}`
            const newStreak = habit.current_streak + 1
            const newLongest = Math.max(habit.longest_streak, newStreak)

            set((state) => ({
                logs: [...state.logs, { id: tempId, habit_id: habitId, completed_on: dateStr, note: null }],
                habits: state.habits.map(h =>
                    h.id === habitId
                        ? { ...h, current_streak: newStreak, longest_streak: newLongest }
                        : h
                )
            }))

            try {
                const { data: insertedLog, error: logError } = await supabase
                    .from('habit_logs')
                    .insert({ habit_id: habitId, completed_on: dateStr })
                    .select()
                    .single()

                if (logError) throw logError

                await supabase.from('habits').update({
                    current_streak: newStreak,
                    longest_streak: newLongest
                }).eq('id', habitId)

                // Replace temp ID with real ID
                set((state) => ({
                    logs: state.logs.map(l => l.id === tempId ? insertedLog : l)
                }))
            } catch (e) {
                set({ logs: state.logs, habits: state.habits, error: (e as Error).message })
            }
        }
    }
}))
