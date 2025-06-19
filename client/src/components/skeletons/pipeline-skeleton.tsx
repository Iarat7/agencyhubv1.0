import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PipelineSkeleton() {
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
            <Skeleton className="h-10 w-40" />
          </div>
        </header>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="text-center">
                  <Skeleton className="h-4 w-24 mx-auto mb-2" />
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-3 w-20 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
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

        {/* Pipeline Kanban Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          {['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'].map((stage, columnIndex) => (
            <div key={columnIndex} className="space-y-4">
              {/* Column Header */}
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>

              {/* Opportunity Cards */}
              {Array.from({ length: columnIndex === 0 ? 4 : columnIndex === 4 ? 2 : 3 }).map((_, cardIndex) => (
                <Card key={cardIndex} className="hover:shadow-lg transition-shadow">
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
                      {/* Deal value */}
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Skeleton className="h-6 w-24 mx-auto mb-1" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                      </div>

                      {/* Deal details */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-between pt-2">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add new placeholder */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Skeleton className="h-8 w-8 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}