import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProductsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-4 lg:p-8 max-w-full">
        <div className="space-y-6 lg:space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* KPIs Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 flex-1">
              <div className="relative flex-1 lg:max-w-md">
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full sm:w-48" />
            </div>
            <Skeleton className="h-10 w-full sm:w-auto" />
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    
                    {/* Price section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-between mt-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}