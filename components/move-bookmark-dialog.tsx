"use client"

import { useState, useEffect } from "react"
import { useSession } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Bookmark, FolderPlus } from "lucide-react"

type Collection = {
  id: string
  name: string
  color: string
}

interface MoveBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarkId: string
  currentCollectionId: string | null
  onSuccess?: () => void
}

export default function MoveBookmarkDialog({
  open,
  onOpenChange,
  bookmarkId,
  currentCollectionId,
  onSuccess
}: MoveBookmarkDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(currentCollectionId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const session = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch collections when dialog opens
  useEffect(() => {
    if (open && session?.user?.id) {
      fetchCollections()
    }
  }, [open, session?.user?.id])

  // Set selected collection to current collection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCollectionId(currentCollectionId || "")
    }
  }, [open, currentCollectionId])

  const fetchCollections = async () => {
    if (!session?.user?.id) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/collections')
      if (!response.ok) throw new Error('Failed to fetch collections')
      
      const data = await response.json()
      // The API returns the collections array directly, not nested under a 'collections' property
      setCollections(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMoveBookmark = async () => {
    if (!bookmarkId) return
    
    setIsMoving(true)
    try {
      const response = await fetch(`/api/bookmarks/${bookmarkId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collection_id: selectedCollectionId || null }),
      })
      
      if (!response.ok) throw new Error('Failed to move bookmark')
      
      toast({
        title: "Bookmark moved",
        description: selectedCollectionId 
          ? `Moved to ${collections.find(c => c.id === selectedCollectionId)?.name || 'collection'}` 
          : "Removed from collection",
      })
      
      onOpenChange(false)
      onSuccess?.() // Refresh bookmarks list
    } catch (error) {
      console.error('Error moving bookmark:', error)
      toast({
        title: "Error",
        description: "Failed to move bookmark",
        variant: "destructive",
      })
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to Collection</DialogTitle>
          <DialogDescription>Select a destination collection for this bookmark</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <RadioGroup value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
            <div className="space-y-3 p-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="" id="default-collection" />
                <Label htmlFor="default-collection" className="flex items-center space-x-2 cursor-pointer">
                  <Bookmark className="h-4 w-4" />
                  <span>Default Collection</span>
                </Label>
              </div>
              
              {isLoading ? (
                <div className="py-4 text-center text-gray-500">Loading collections...</div>
              ) : collections.length > 0 ? (
                collections.map((collection) => (
                  <div key={collection.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={collection.id} id={`collection-${collection.id}`} />
                    <Label 
                      htmlFor={`collection-${collection.id}`} 
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: collection.color || '#10b981' }}
                      />
                      <span>{collection.name}</span>
                    </Label>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No collections found. Create one below.
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2 flex items-center justify-center"
                onClick={() => {
                  onOpenChange(false);
                  router.push('/bookmarks');
                }}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Manage Collections
              </Button>
            </div>
          </RadioGroup>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMoveBookmark} disabled={isMoving}>
            {isMoving ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
