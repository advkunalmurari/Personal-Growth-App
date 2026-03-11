import { Skeleton } from "@/components/ui/skeleton"

function GoalSkeletonNode({ isChild = false }: { isChild?: boolean }) {
    return (
        <div className={`relative ${isChild ? 'ml-8 mt-2' : 'mb-4'}`}>
            {/* Visual connecting line for children */}
            {isChild && (
                <div className="absolute -left-6 top-6 w-5 h-px bg-gray-700/50" />
            )}
            {isChild && (
                <div className="absolute -left-6 -top-4 bottom-6 w-px bg-gray-700/50" />
            )}

            <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                </div>
                <div className="flex items-center gap-4 mt-1">
                    <Skeleton className="h-2 w-full max-w-[200px] rounded-full" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-20 ml-auto" />
                </div>
            </div>
        </div>
    )
}

export default function GoalTreeSkeleton() {
    return (
        <div className="space-y-6">
            {/* Root Node 1 */}
            <div>
                <GoalSkeletonNode />
                <div className="relative">
                    <GoalSkeletonNode isChild />
                    <GoalSkeletonNode isChild />
                </div>
            </div>

            {/* Root Node 2 */}
            <div>
                <GoalSkeletonNode />
                <div className="relative">
                    <GoalSkeletonNode isChild />
                    <GoalSkeletonNode isChild />
                </div>
            </div>
        </div>
    )
}
