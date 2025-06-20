"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"

const emojiCategories = {
  "Smileys & People": [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤢",
    "🤮",
    "🤧",
    "🥵",
    "🥶",
    "🥴",
    "😵",
    "🤯",
    "🤠",
    "🥳",
    "😎",
    "🤓",
    "🧐",
  ],
  Nature: [
    "🌱",
    "🌿",
    "🍀",
    "🌳",
    "🌲",
    "🌴",
    "🌵",
    "🌾",
    "🌻",
    "🌺",
    "🌸",
    "🌼",
    "🌷",
    "🥀",
    "🌹",
    "🏵️",
    "💐",
    "🍄",
    "🌰",
    "🎋",
    "🍃",
    "🍂",
    "🍁",
    "🌊",
    "🌀",
    "🌈",
    "🌤️",
    "⛅",
    "🌦️",
    "🌧️",
    "⛈️",
    "🌩️",
    "🌨️",
    "❄️",
    "☀️",
    "🌞",
    "🌝",
    "🌛",
    "🌜",
    "🌚",
  ],
  Sustainability: [
    "♻️",
    "🌍",
    "🌎",
    "🌏",
    "🌱",
    "🌿",
    "🍃",
    "🌳",
    "🌲",
    "🌴",
    "🌵",
    "🌾",
    "🌻",
    "🌺",
    "🌸",
    "🌼",
    "🌷",
    "🌹",
    "💚",
    "💙",
    "⚡",
    "🔋",
    "💡",
    "🔆",
    "☀️",
    "🌞",
    "🌊",
    "💧",
    "🚲",
    "🚶",
    "🏃",
    "🌈",
    "🦋",
    "🐝",
    "🐛",
    "🕷️",
    "🐞",
    "🦗",
    "🐢",
    "🐸",
  ],
  Objects: [
    "💻",
    "📱",
    "⌚",
    "📷",
    "📹",
    "🎥",
    "📞",
    "☎️",
    "📠",
    "📺",
    "📻",
    "🎙️",
    "🎚️",
    "🎛️",
    "⏰",
    "⏲️",
    "⏱️",
    "🕰️",
    "📡",
    "🔋",
    "🔌",
    "💡",
    "🔦",
    "🕯️",
    "🗑️",
    "🛢️",
    "💸",
    "💵",
    "💴",
    "💶",
    "💷",
    "💰",
    "💳",
    "💎",
    "⚖️",
    "🔧",
    "🔨",
    "⚒️",
    "🛠️",
    "⛏️",
  ],
  Activities: [
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🪀",
    "🏓",
    "🏸",
    "🏒",
    "🏑",
    "🥍",
    "🏏",
    "🪃",
    "🥅",
    "⛳",
    "🪁",
    "🏹",
    "🎣",
    "🤿",
    "🥊",
    "🥋",
    "🎽",
    "🛹",
    "🛷",
    "⛸️",
    "🥌",
    "🎿",
    "⛷️",
    "🏂",
    "🪂",
    "🏋️",
    "🤼",
    "🤸",
    "⛹️",
    "🤺",
  ],
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  children: React.ReactNode
}

export default function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Smileys & People")

  const filteredEmojis = searchQuery
    ? Object.values(emojiCategories)
        .flat()
        .filter((emoji) => {
          // Simple search - you could enhance this with emoji names/keywords
          return true
        })
    : emojiCategories[selectedCategory as keyof typeof emojiCategories] || []

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {!searchQuery && (
          <div className="flex overflow-x-auto p-2 border-b">
            {Object.keys(emojiCategories).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap text-xs"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        <ScrollArea className="h-64">
          <div className="grid grid-cols-8 gap-1 p-3">
            {filteredEmojis.map((emoji, index) => (
              <Button
                key={`${emoji}-${index}`}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => onEmojiSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
