'use client'

import { useEffect, useState } from 'react'
import { useKnowledgeStore, KnowledgeItem, KnowledgeType } from '@/stores/knowledgeStore'
import {
    BookOpen, Plus, Brain, Lightbulb, Link2, Cpu, X,
    ChevronRight, ChevronLeft, CheckCircle2, XCircle, Trash2, Tag, RefreshCw
} from 'lucide-react'

const TYPE_CONFIG: Record<KnowledgeType, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    concept: {
        label: 'Concept',
        color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
        icon: <Brain className="w-4 h-4" />,
        description: 'A fundamental idea or principle worth remembering'
    },
    application: {
        label: 'Application',
        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        icon: <Cpu className="w-4 h-4" />,
        description: 'How to apply something in practice'
    },
    connection: {
        label: 'Connection',
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        icon: <Link2 className="w-4 h-4" />,
        description: 'A link between two ideas or domains'
    },
    insight: {
        label: 'Insight',
        color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20',
        icon: <Lightbulb className="w-4 h-4" />,
        description: 'A personal "aha!" moment or realization'
    }
}

const LEITNER_COLORS: Record<string, string> = {
    '1': 'bg-red-500/20 text-red-400 border-red-500/30',
    '2': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    '3': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    '4': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    '5': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

type ModalState = 'closed' | 'capture' | 'flashcard'

export default function KnowledgePage() {
    const { items, isLoading, fetchItems, addItem, deleteItem, reviewItem } = useKnowledgeStore()
    const [modal, setModal] = useState<ModalState>('closed')
    const [flashcardIndex, setFlashcardIndex] = useState(0)
    const [showAnswer, setShowAnswer] = useState(false)
    const [activeFilter, setActiveFilter] = useState<KnowledgeType | 'all'>('all')

    // Capture form state
    const [form, setForm] = useState({
        type: 'insight' as KnowledgeType,
        title: '',
        content: '',
        source: '',
        tags: '',
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchItems() }, [fetchItems])

    // Due for review today
    const today = new Date().toISOString().split('T')[0]
    const dueCards = items.filter(i => i.next_review_date <= today)
    const currentCard = dueCards[flashcardIndex]

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) return
        setSaving(true)
        await addItem({
            type: form.type,
            title: form.title.trim(),
            content: form.content.trim(),
            source: form.source.trim() || undefined,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            leitner_box: '1',
            next_review_date: today,
        })
        setForm({ type: 'insight', title: '', content: '', source: '', tags: '' })
        setSaving(false)
        setModal('closed')
    }

    const handleReview = async (remembered: boolean) => {
        if (!currentCard) return
        await reviewItem(currentCard.id, remembered)
        if (flashcardIndex >= dueCards.length - 1) {
            setModal('closed')
            setFlashcardIndex(0)
        } else {
            setShowAnswer(false)
            setFlashcardIndex(i => i + 1)
        }
    }

    const filtered = activeFilter === 'all' ? items : items.filter(i => i.type === activeFilter)

    const stats = {
        total: items.length,
        dueToday: dueCards.length,
        mastered: items.filter(i => i.leitner_box === '5').length,
        avgBox: items.length ? (items.reduce((s, i) => s + parseInt(i.leitner_box), 0) / items.length).toFixed(1) : '0'
    }

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Second Brain</h1>
                    <p className="text-slate-400 mt-1">Capture insights, build knowledge, review with spaced repetition.</p>
                </div>
                <div className="flex items-center gap-2">
                    {dueCards.length > 0 && (
                        <button
                            onClick={() => { setModal('flashcard'); setFlashcardIndex(0); setShowAnswer(false) }}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Review {dueCards.length} Cards
                        </button>
                    )}
                    <button
                        onClick={() => setModal('capture')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Capture Insight
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Items', value: stats.total, icon: <BookOpen className="w-5 h-5 text-indigo-400" /> },
                    { label: 'Due Today', value: stats.dueToday, icon: <RefreshCw className="w-5 h-5 text-amber-400" /> },
                    { label: 'Mastered (Box 5)', value: stats.mastered, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
                    { label: 'Avg Leitner Box', value: stats.avgBox, icon: <Brain className="w-5 h-5 text-fuchsia-400" /> },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
                        <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs text-slate-500">{stat.label}</span></div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Knowledge Type Templates */}
            <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Knowledge Templates</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(TYPE_CONFIG) as KnowledgeType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => { setForm(f => ({ ...f, type })); setModal('capture') }}
                            className="text-left p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-all group"
                        >
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium mb-3 ${TYPE_CONFIG[type].color}`}>
                                {TYPE_CONFIG[type].icon}
                                {TYPE_CONFIG[type].label}
                            </div>
                            <p className="text-xs text-slate-400 leading-snug">{TYPE_CONFIG[type].description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {(['all', 'concept', 'application', 'connection', 'insight'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${activeFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        {f === 'all' ? `All (${items.length})` : `${TYPE_CONFIG[f].label} (${items.filter(i => i.type === f).length})`}
                    </button>
                ))}
            </div>

            {/* Knowledge Items Grid */}
            {isLoading ? (
                <div className="text-center py-16 text-slate-500">Loading your knowledge base...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No items yet</p>
                    <p className="text-sm text-slate-600 mt-1">Click &ldquo;Capture Insight&rdquo; to add your first knowledge item</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(item => (
                        <KnowledgeCard key={item.id} item={item} onDelete={() => deleteItem(item.id)} />
                    ))}
                </div>
            )}

            {/* Capture Modal */}
            {modal === 'capture' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <h2 className="font-semibold text-white">Capture Knowledge</h2>
                            <button onClick={() => setModal('closed')} title="Close" className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Type selector */}
                            <div className="grid grid-cols-4 gap-2">
                                {(Object.keys(TYPE_CONFIG) as KnowledgeType[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setForm(f => ({ ...f, type: t }))}
                                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all border flex items-center justify-center gap-1.5 ${form.type === t ? TYPE_CONFIG[t].color : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {TYPE_CONFIG[t].icon}
                                        {TYPE_CONFIG[t].label}
                                    </button>
                                ))}
                            </div>
                            <input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Title — the core idea in one line"
                                aria-label="Knowledge item title"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <textarea
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                placeholder="Explain it fully. The more detail, the more you'll retain."
                                aria-label="Knowledge item content"
                                rows={4}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                            />
                            <input
                                value={form.source}
                                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                                placeholder="Source (book, article, experience...)"
                                aria-label="Knowledge item source"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input
                                value={form.tags}
                                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                placeholder="Tags (comma separated: mindset, productivity, design)"
                                aria-label="Knowledge item tags"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleSave}
                                disabled={!form.title.trim() || !form.content.trim() || saving}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save to Knowledge Base'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Flashcard Review Modal */}
            {modal === 'flashcard' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md space-y-4">
                        {/* Progress */}
                        <div className="flex items-center justify-between text-sm text-slate-400">
                            <span>Card {flashcardIndex + 1} of {dueCards.length}</span>
                            <button onClick={() => setModal('closed')} title="Exit review" className="text-slate-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${((flashcardIndex + 1) / dueCards.length) * 100}%` }} />
                        </div>

                        {/* Card */}
                        {currentCard && (
                            <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-slate-800">
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium mb-4 ${TYPE_CONFIG[currentCard.type].color}`}>
                                        {TYPE_CONFIG[currentCard.type].icon}
                                        {TYPE_CONFIG[currentCard.type].label}
                                    </div>
                                    <p className="text-xl font-semibold text-white leading-snug">{currentCard.title}</p>
                                    {currentCard.source && <p className="text-xs text-slate-500 mt-2">Source: {currentCard.source}</p>}
                                </div>

                                {!showAnswer ? (
                                    <div className="p-6">
                                        <button
                                            onClick={() => setShowAnswer(true)}
                                            className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm flex items-center justify-center gap-2"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                            Reveal Answer
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-4">
                                        <p className="text-sm text-slate-300 leading-relaxed">{currentCard.content}</p>
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button
                                                onClick={() => handleReview(false)}
                                                className="flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all text-sm font-medium"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Forgot
                                            </button>
                                            <button
                                                onClick={() => handleReview(true)}
                                                className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-medium"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Remembered
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between">
                            <button
                                onClick={() => { setFlashcardIndex(i => Math.max(0, i - 1)); setShowAnswer(false) }}
                                disabled={flashcardIndex === 0}
                                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 disabled:opacity-30 hover:text-white transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>
                            <button
                                onClick={() => { setFlashcardIndex(i => Math.min(dueCards.length - 1, i + 1)); setShowAnswer(false) }}
                                disabled={flashcardIndex >= dueCards.length - 1}
                                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 disabled:opacity-30 hover:text-white transition-all"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function KnowledgeCard({ item, onDelete }: { item: KnowledgeItem; onDelete: () => void }) {
    const config = TYPE_CONFIG[item.type]
    return (
        <div className="rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all p-4 group">
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-medium ${config.color}`}>
                        {config.icon}
                        {config.label}
                    </span>
                    <span className={`text-[11px] font-semibold border px-1.5 py-0.5 rounded ${LEITNER_COLORS[item.leitner_box]}`}>
                        Box {item.leitner_box}
                    </span>
                </div>
                <button
                    onClick={onDelete}
                    title="Delete knowledge item"
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <h3 className="font-semibold text-white text-sm leading-snug mb-1.5">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{item.content}</p>
            {item.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <Tag className="w-3 h-3 text-slate-600" />
                    {item.tags.map(tag => (
                        <span key={tag} className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">#{tag}</span>
                    ))}
                </div>
            )}
            {item.source && (
                <p className="text-[11px] text-slate-600 mt-2 truncate">📖 {item.source}</p>
            )}
        </div>
    )
}
