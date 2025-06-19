import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ClientsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-4 lg:p-8 max-w-full">
        {/* Header Skeleton */}
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </header>

        {/* Search and Filters Skeleton */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <Skeleton className="h-10 w-full sm:w-48" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clients Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-4">
                    <Skeleton className="h-8 w-20" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}