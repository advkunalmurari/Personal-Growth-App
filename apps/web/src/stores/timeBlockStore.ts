import { create } from 'zustand'
import { createBrowserClient } from '@supabase/ssr'

export type BlockType = 'deep_work' | 'study' | 'business' | 'exercise' | 'skill_dev' | 'spiritual' | 'admin'

export interface TimeBlock {
    id: string
    user_id: string
    date: string
    start_time: string
    end_time: string
    block_type: BlockType
    task_id: string | null
    focus_score: number | null
    created_at: string
    updated_at: string
}

interface TimeBlockState {
    blocks: TimeBlock[]
    isLoading: boolean
    error: string | null
    fetchBlocks: (date: string) => Promise<void>
    createBlock: (block: Partial<TimeBlock>) => Promise<void>
    updateBlock: (id: string, updates: Partial<TimeBlock>) => Promise<void>
    deleteBlock: (id: string) => Promise<void>
}

export const useTimeBlockStore = create<TimeBlockState>((set, get) => ({
    blocks: [],
    isLoading: false,
    error: null,

    fetchBlocks: async (date: string) => {
        set({ isLoading: true, error: null })
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('time_blocks')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', date)
                .order('start_time', { ascending: true })

            if (error) throw error
            set({ blocks: data || [] })
        } catch (err) {
            set({ error: (err as Error).message })
        } finally {
            set({ isLoading: false })
        }
    },

    createBlock: async (block) => {
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const newBlock = { ...block, user_id: user.id }

            // Optimistic update
            const tempId = crypto.randomUUID()
            set(state => ({
                blocks: [...state.blocks, { ...newBlock, id: tempId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as TimeBlock].sort((a, b) => a.start_time.localeCompare(b.start_time))
            }))

            const { data, error } = await supabase
                .from('time_blocks')
                .insert([newBlock])
                .select()
                .single()

            if (error) throw error

            // Replace temp with real
            set(state => ({
                blocks: state.blocks.map(b => b.id === tempId ? data : b)
            }))

        } catch (err) {
            // Rollback on fully robust implementation, but log for now
            set({ error: (err as Error).message })
            // Also refetch to restore truth
            const dateStr = block.date || new Date().toISOString().split('T')[0]
            get().fetchBlocks(dateStr)
        }
    },

    updateBlock: async (id, updates) => {
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            // Optimistic update
            set(state => ({
                blocks: state.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
            }))

            const { error } = await supabase
                .from('time_blocks')
                .update(updates)
                .eq('id', id)

            if (error) throw error

        } catch (err) {
            set({ error: (err as Error).message })
            const today = new Date().toISOString().split('T')[0]
            get().fetchBlocks(today)
        }
    },

    deleteBlock: async (id) => {
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            // Optimistic
            set(state => ({
                blocks: state.blocks.filter(b => b.id !== id)
            }))

            const { error } = await supabase
                .from('time_blocks')
                .delete()
                .eq('id', id)

            if (error) throw error

        } catch (err) {
            set({ error: (err as Error).message })
            const today = new Date().toISOString().split('T')[0]
            get().fetchBlocks(today)
        }
    }

}))
