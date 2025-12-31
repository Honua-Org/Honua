"use client"

import { useRouter } from "next/navigation"
import MainLayout from "@/components/main-layout"
import CreatePostModal from "@/components/create-post-modal"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CreatePostPage() {
  const router = useRouter()

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pb-20 lg:pb-4">
        <div className="sm:hidden sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-2 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-sm font-medium">Create Post</div>
        </div>
        <div className="px-2 sm:px-6 py-3 sm:py-6">
          <CreatePostModal
            open
            onOpenChange={(open) => {
              if (!open) router.back()
            }}
            onPostCreated={() => router.back()}
            variant="page"
          />
        </div>
      </div>
    </MainLayout>
  )
}
