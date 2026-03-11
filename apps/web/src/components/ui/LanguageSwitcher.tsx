'use client'

import { useTranslation } from 'react-i18next'
import '@/lib/i18n' // Initialize i18n

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
]

export default function LanguageSwitcher() {
    const { i18n } = useTranslation()

    return (
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
            {LANGUAGES.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    title={`Switch to ${lang.label}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5
                        ${i18n.language === lang.code
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                </button>
            ))}
        </div>
    )
}
