import { createClient } from '@/lib/supabase/client'
import { create } from 'zustand'

export type ReviewType = 'daily' | 'weekly' | 'monthly'

export interface ReviewMetrics {
    energy?: number
    focus?: number
    clarity?: number
    [key: string]: number | undefined
}

export interface ReviewSession {
    id: string
    user_id: string
    review_type: ReviewType
    review_date: string // YYYY-MM-DD format usually
    metrics: ReviewMetrics
    notes: string | null
    created_at: string
    updated_at: string
}

interface ReviewState {
    reviews: ReviewSession[]
    isLoading: boolean
    error: string | null
    fetchReviews: () => Promise<void>
    saveReview: (reviewType: ReviewType, dateStr: string, metrics: ReviewMetrics, notes: string) => Promise<void>
}

export const useReviewStore = create<ReviewState>((set) => ({
    reviews: [],
    isLoading: false,
    error: null,

    fetchReviews: async () => {
        set({ isLoading: true, error: null })
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('Not authenticated')

            const { data, error } = await supabase
                .from('review_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('review_date', { ascending: false })

            if (error) throw error

            set({ reviews: data as ReviewSession[], isLoading: false })
        } catch (e) {
            set({ error: (e as Error).message, isLoading: false })
        }
    },

    saveReview: async (reviewType, dateStr, metrics, notes) => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Upsert the review (update if exists for this type/date/user, otherwise insert)
            // Note: Supabase upsert requires the unique constraint to trigger conflicts
            // We defined a unique constraint: UNIQUE (user_id, review_type, review_date)

            const payload = {
                user_id: user.id,
                review_type: reviewType,
                review_date: dateStr,
                metrics,
                notes
            }

            const { data, error } = await supabase
                .from('review_sessions')
                .upsert(payload, { onConflict: 'user_id,review_type,review_date' })
                .select()
                .single()

            if (error) throw error

            // Update local state
            set((state) => {
                const existingIndex = state.reviews.findIndex(r => r.id === (data as ReviewSession).id)
                if (existingIndex >= 0) {
                    const newReviews = [...state.reviews]
                    newReviews[existingIndex] = data as ReviewSession
                    return { reviews: newReviews }
                } else {
                    return { reviews: [data as ReviewSession, ...state.reviews] }
                }
            })

        } catch (e) {
            set({ error: (e as Error).message })
        }
    }
}))
