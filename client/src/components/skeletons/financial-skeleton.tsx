import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FinancialSkeleton() {
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
            <div className="flex gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </header>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <Skeleton className="h-10 w-full sm:w-48" />
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
        </div>

        {/* Financial Records Table */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 pb-2 border-b">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
              
              {/* Table Rows */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 py-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}