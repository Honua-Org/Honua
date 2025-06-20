"use client"

import { useState } from "react"
import { useSession } from "@supabase/auth-helpers-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ImageIcon, MapPin, Smile, Calendar, Globe, Users, Lock, X } from "lucide-react"
import Image from "next/image"
import EmojiPicker from "@/components/emoji-picker"

const sustainabilityCategories = [
  "Solar Energy",
  "Wind Power",
  "Recycling & Waste Reduction",
  "Sustainable Transportation",
  "Green Building",
  "Climate Action",
  "Conservation",
  "Renewable Energy",
  "Sustainable Agriculture",
  "Environmental Education",
]

interface CreatePostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [location, setLocation] = useState("")
  const [privacy, setPrivacy] = useState("public")
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const session = useSession()
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something before posting",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Post created!",
        description: "Your sustainability post has been shared with the community",
      })
      setContent("")
      setSelectedCategory("")
      setLocation("")
      setSelectedImages([])
      setLoading(false)
      onOpenChange(false)
    }, 1000)
  }

  const handleCancel = () => {
    setContent("")
    setSelectedCategory("")
    setLocation("")
    setSelectedImages([])
    onOpenChange(false)
  }

  const handleImageUpload = () => {
    // Simulate image selection with real sustainability images
    const mockImages = [
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    ]
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)]
    setSelectedImages((prev) => [...prev, randomImage])
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji)
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src="/images/profiles/sarah-green-avatar.png" />
              <AvatarFallback className="bg-green-500 text-white">
                {session?.user?.user_metadata?.full_name?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="What's your latest sustainability action? Share your impact..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none border-none shadow-none text-lg placeholder:text-gray-500 focus-visible:ring-0"
              />

              {/* Image Preview */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Selected image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {sustainabilityCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Add location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    onClick={handleImageUpload}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Media
                  </Button>
                  <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                      <Smile className="w-4 h-4 mr-2" />
                      Emoji
                    </Button>
                  </EmojiPicker>
                  <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="followers">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Followers
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center">
                          <Lock className="w-4 h-4 mr-2" />
                          Private
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCategory && (
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    {selectedCategory}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSelectedCategory("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">{content.length}/280 characters</div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || loading}
                    className="sustainability-gradient"
                  >
                    {loading ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
