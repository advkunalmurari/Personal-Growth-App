import { Skeleton } from "@/components/ui/skeleton"
import { Target, Activity, Zap, TrendingUp, Flame } from "lucide-react"

export default function DashboardSkeleton() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto custom-scrollbar">
            {/* Top Stats Array Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/50 to-indigo-950/50 border border-indigo-500/20 rounded-3xl p-8">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-72 mb-6" />
                    <div className="flex gap-4">
                        <Skeleton className="h-20 w-[120px] rounded-xl" />
                        <Skeleton className="h-20 w-[120px] rounded-xl" />
                    </div>
                </div>

                <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-3 w-28 mt-2" />
                </div>

                <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-3 w-36 mt-2" />
                </div>
            </div>

            {/* Main Layout Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: TodayPlan Skeleton */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-gray-900 to-indigo-950/20 rounded-3xl p-6 border border-gray-800/80">
                        <Skeleton className="h-8 w-64 mb-6" />
                        <div className="bg-gray-950/50 rounded-2xl p-4 border border-gray-800/50 mb-6">
                            <Skeleton className="h-14 w-full mb-3" />
                            <Skeleton className="h-14 w-full mb-3" />
                            <Skeleton className="h-14 w-full" />
                        </div>
                        <Skeleton className="h-6 w-32 mb-4 mt-8" />
                        <div className="flex gap-3">
                            <Skeleton className="w-14 h-14 rounded-2xl" />
                            <Skeleton className="w-14 h-14 rounded-2xl" />
                            <Skeleton className="w-14 h-14 rounded-2xl" />
                        </div>
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="space-y-8">
                    <section className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                        <Skeleton className="h-6 w-48 mb-6" />
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-8" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                            <Skeleton className="h-10 w-full rounded-xl mt-4" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
