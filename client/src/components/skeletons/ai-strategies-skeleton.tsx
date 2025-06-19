import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AiStrategiesSkeleton() {
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
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </header>

        {/* Filters Skeleton */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-6">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <Skeleton className="h-10 w-full sm:w-48 lg:w-52" />
            <Skeleton className="h-10 w-full sm:w-40 lg:w-44" />
          </div>
        </div>

        {/* Kanban Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {['Criadas', 'Em Análise', 'Aprovadas', 'Executando', 'Rejeitadas'].map((status, columnIndex) => (
            <div key={columnIndex} className="space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>

              {/* Strategy Cards */}
              {Array.from({ length: columnIndex === 0 ? 3 : columnIndex === 1 ? 2 : 1 }).map((_, cardIndex) => (
                <Card key={cardIndex} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-5 w-full mb-2" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Strategy content preview */}
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-3 w-3/5" />
                      </div>

                      {/* Dates section */}
                      <div className="grid grid-cols-1 gap-2 text-xs">
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>

                      {/* Navigation buttons */}
                      <div className="pt-2">
                        {columnIndex === 1 ? (
                          <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add new card placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Skeleton className="h-8 w-8 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}