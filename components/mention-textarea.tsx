"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface User {
  id: string
  username: string
  full_name: string
  avatar_url: string
  verified?: boolean
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  unstyled?: boolean
}

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  className,
  minHeight = "120px",
  unstyled = false
}: MentionTextareaProps) {
  const [users, setUsers] = useState<User[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [mentionStartPos, setMentionStartPos] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Search for users
  const searchUsers = async (query: string) => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const users = data.users || []
      setUsers(users)
      setShowMentions(users.length > 0)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Error searching users:', error)
      setUsers([])
      setShowMentions(false)
    }
  }

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    onChange(newValue)
    setCursorPosition(cursorPos)

    // Check for @ mentions
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/)
    
    if (mentionMatch) {
      const query = mentionMatch[1]
      const startPos = cursorPos - mentionMatch[0].length
      
      setMentionQuery(query)
      setMentionStartPos(startPos)
      
      // Clear existing timeout
      if (mentionTimeoutRef.current) {
        clearTimeout(mentionTimeoutRef.current)
      }
      
      // Search immediately for empty query (just @) or after short delay
      if (query === "") {
        searchUsers(query)
      } else {
        mentionTimeoutRef.current = setTimeout(() => {
          searchUsers(query)
        }, 150)
      }
    } else {
      setShowMentions(false)
      setUsers([])
      setMentionQuery("")
      if (mentionTimeoutRef.current) {
        clearTimeout(mentionTimeoutRef.current)
      }
    }
  }

  // Handle mention selection
  const selectMention = (user: User) => {
    const beforeMention = value.slice(0, mentionStartPos)
    const afterMention = value.slice(cursorPosition)
    const mentionText = `@${user.username} `
    
    const newValue = beforeMention + mentionText + afterMention
    const newCursorPos = mentionStartPos + mentionText.length
    
    onChange(newValue)
    setShowMentions(false)
    setUsers([])
    setMentionQuery("")
    
    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || users.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % users.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length)
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        selectMention(users[selectedIndex])
        break
      case 'Escape':
        setShowMentions(false)
        setUsers([])
        break
    }
  }

  // Calculate dropdown position
  const getDropdownPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 }
    
    const textarea = textareaRef.current
    const textBeforeCursor = value.slice(0, mentionStartPos)
    const lines = textBeforeCursor.split('\n')
    const currentLine = lines.length - 1
    const currentColumn = lines[lines.length - 1].length
    
    // Approximate character width and line height
    const charWidth = 8
    const lineHeight = 24
    
    return {
      top: (currentLine + 1) * lineHeight + 8,
      left: currentColumn * charWidth + 8
    }
  }

  const dropdownPosition = getDropdownPosition()

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (mentionTimeoutRef.current) {
        clearTimeout(mentionTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <Textarea
        unstyled={unstyled}
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} min-h-[${minHeight}] resize-none`}
        style={{ minHeight }}
      />
      
      {/* Mentions Dropdown */}
      {showMentions && users.length > 0 && (
        <div 
          className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[9999] max-h-48 overflow-y-auto min-w-[280px] backdrop-blur-sm"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          {users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectMention(user)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none ${
                index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-green-500 text-white text-xs">
                    {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-sm truncate">{user.full_name || user.username}</span>
                    {user.verified && (
                      <Badge variant="secondary" className="h-4 w-4 p-0 bg-blue-100 text-blue-600">
                        <Check className="h-2 w-2" />
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
