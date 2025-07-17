import MainLayout from "@/components/main-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ThreadDetailLoading() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Back Navigation Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
        </div>

        {/* Thread Header Skeleton */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-32 w-full" />
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-18" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Comment Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>

        {/* Comments Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-6 w-40" />

          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <div className="flex space-x-4">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
