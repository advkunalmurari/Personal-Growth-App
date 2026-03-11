'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useReviewStore, ReviewType, ReviewMetrics } from '@/stores/reviewStore'
import { Calendar, Save, FileText, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

export default function ReviewPage() {
    const { reviews, isLoading, fetchReviews, saveReview, error } = useReviewStore()
    const [currentTab, setCurrentTab] = useState<ReviewType>('daily')

    // Form state for new/editing review
    const [energy, setEnergy] = useState<number>(5)
    const [focus, setFocus] = useState<number>(5)
    const [clarity, setClarity] = useState<number>(5)
    const [notes, setNotes] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        fetchReviews()
    }, [fetchReviews])

    const todayStr = format(new Date(), 'yyyy-MM-dd')

    // Find if a review for today/this week exists
    useEffect(() => {
        const existingReview = reviews.find(r => r.review_type === currentTab && r.review_date === todayStr)
        if (existingReview) {
            setEnergy(existingReview.metrics.energy || 5)
            setFocus(existingReview.metrics.focus || 5)
            setClarity(existingReview.metrics.clarity || 5)
            setNotes(existingReview.notes || '')
        } else {
            setEnergy(5)
            setFocus(5)
            setClarity(5)
            setNotes('')
        }
        setSaveSuccess(false)
    }, [currentTab, reviews, todayStr])

    const handleSave = async () => {
        setIsSaving(true)
        setSaveSuccess(false)
        const metrics: ReviewMetrics = { energy, focus, clarity }

        await saveReview(currentTab, todayStr, metrics, notes)

        setIsSaving(false)
        if (!error) {
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
            await fetchReviews() // Refresh list
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Review Systems</h1>
                    <p className="text-slate-400">Reflect on your progress and capture insights.</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-900 rounded-lg outline outline-1 outline-slate-800 w-fit">
                    {(['daily', 'weekly', 'monthly'] as ReviewType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setCurrentTab(type)}
                            className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${currentTab === type
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - New/Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <span className="capitalize">{currentTab} Reflection</span>
                            </CardTitle>
                            <CardDescription>
                                For {format(new Date(), 'MMMM d, yyyy')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Metrics Sliders */}
                            <div className="space-y-4 p-4 rounded-lg bg-slate-900 border border-slate-800">
                                <h3 className="text-sm font-medium text-slate-300 mb-4">Core Metrics (1-10)</h3>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-sm">
                                            <label htmlFor="energy" className="text-slate-400">Energy Level</label>
                                            <span className="font-medium text-emerald-400">{energy}</span>
                                        </div>
                                        <input
                                            id="energy"
                                            type="range" min="1" max="10"
                                            value={energy}
                                            onChange={(e) => setEnergy(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-sm">
                                            <label htmlFor="focus" className="text-slate-400">Focus & Flow</label>
                                            <span className="font-medium text-blue-400">{focus}</span>
                                        </div>
                                        <input
                                            id="focus"
                                            type="range" min="1" max="10"
                                            value={focus}
                                            onChange={(e) => setFocus(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between text-sm">
                                            <label htmlFor="clarity" className="text-slate-400">Mental Clarity</label>
                                            <span className="font-medium text-purple-400">{clarity}</span>
                                        </div>
                                        <input
                                            id="clarity"
                                            type="range" min="1" max="10"
                                            value={clarity}
                                            onChange={(e) => setClarity(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Freeform Notes */}
                            <div className="space-y-2">
                                <label htmlFor="notes" className="text-sm font-medium text-slate-300">
                                    {currentTab === 'daily' ? 'What went well? What could be improved?' :
                                        currentTab === 'weekly' ? 'Weekly highlights and course corrections:' :
                                            'Monthly reflection and macro adjustments:'}
                                </label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Write your insights here..."
                                    className="w-full h-40 p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end items-center gap-4">
                                {saveSuccess && (
                                    <span className="text-sm text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" /> Saved successfully
                                    </span>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {isSaving ? 'Saving...' : 'Save Reflection'}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - History */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        Past {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)} Reviews
                    </h3>

                    <div className="space-y-3">
                        {isLoading ? (
                            <p className="text-sm text-slate-500 italic">Loading past reviews...</p>
                        ) : reviews.filter(r => r.review_type === currentTab).length === 0 ? (
                            <p className="text-sm text-slate-500 italic">No reviews found for this category.</p>
                        ) : (
                            reviews
                                .filter(r => r.review_type === currentTab)
                                .map(review => (
                                    <Card key={review.id} className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-medium text-slate-200">
                                                    {review.review_date}
                                                </span>
                                                <div className="flex gap-2">
                                                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                                                        E:{review.metrics.energy}
                                                    </span>
                                                    <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                                                        F:{review.metrics.focus}
                                                    </span>
                                                    <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                                                        C:{review.metrics.clarity}
                                                    </span>
                                                </div>
                                            </div>
                                            {review.notes && (
                                                <p className="text-sm text-slate-400 line-clamp-2">
                                                    {review.notes}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
