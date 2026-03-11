import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

export type KnowledgeType = 'concept' | 'application' | 'connection' | 'insight'
export type LeitnerBox = '1' | '2' | '3' | '4' | '5'

export interface KnowledgeItem {
    id: string
    user_id: string
    type: KnowledgeType
    title: string
    content: string
    source?: string
    tags: string[]
    leitner_box: LeitnerBox
    next_review_date: string
    last_reviewed_at?: string
    review_count: number
    created_at: string
    updated_at: string
}

interface KnowledgeState {
    items: KnowledgeItem[]
    isLoading: boolean
    error: string | null
    fetchItems: () => Promise<void>
    addItem: (item: Omit<KnowledgeItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'review_count' | 'last_reviewed_at'>) => Promise<void>
    deleteItem: (id: string) => Promise<void>
    reviewItem: (id: string, remembered: boolean) => Promise<void>
}

// Leitner box next review intervals (in days)
const LEITNER_INTERVALS: Record<LeitnerBox, number> = {
    '1': 1,
    '2': 3,
    '3': 7,
    '4': 14,
    '5': 30,
}

function getNextReviewDate(box: LeitnerBox): string {
    const d = new Date()
    d.setDate(d.getDate() + LEITNER_INTERVALS[box])
    return d.toISOString().split('T')[0]
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    fetchItems: async () => {
        set({ isLoading: true, error: null })
        const supabase = createClient()
        const { data, error } = await supabase
            .from('knowledge_items')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            set({ error: error.message, isLoading: false })
        } else {
            set({ items: data as KnowledgeItem[], isLoading: false })
        }
    },

    addItem: async (itemData) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const optimistic: KnowledgeItem = {
            ...itemData,
            id: `temp-${Date.now()}`,
            user_id: user.id,
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        set(state => ({ items: [optimistic, ...state.items] }))

        const { data, error } = await supabase
            .from('knowledge_items')
            .insert({ ...itemData, user_id: user.id })
            .select()
            .single()

        if (error) {
            set(state => ({ items: state.items.filter(i => i.id !== optimistic.id), error: error.message }))
        } else if (data) {
            set(state => ({ items: state.items.map(i => i.id === optimistic.id ? data as KnowledgeItem : i) }))
        }
    },

    deleteItem: async (id) => {
        set(state => ({ items: state.items.filter(i => i.id !== id) }))
        const supabase = createClient()
        await supabase.from('knowledge_items').delete().eq('id', id)
    },

    reviewItem: async (id, remembered) => {
        const item = get().items.find(i => i.id === id)
        if (!item) return

        const currentBox = parseInt(item.leitner_box) as number
        let newBox: LeitnerBox

        if (remembered) {
            // Promote: move to next box (max 5)
            newBox = String(Math.min(5, currentBox + 1)) as LeitnerBox
        } else {
            // Demote: move back to box 1
            newBox = '1'
        }

        const updates = {
            leitner_box: newBox,
            next_review_date: getNextReviewDate(newBox),
            last_reviewed_at: new Date().toISOString(),
            review_count: item.review_count + 1,
        }

        set(state => ({
            items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
        }))

        const supabase = createClient()
        await supabase.from('knowledge_items').update(updates).eq('id', id)
    }
}))
