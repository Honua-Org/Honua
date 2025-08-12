'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogPortal, DialogOverlay, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Twitter } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/auth-helpers-nextjs'

export function CommunityModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Show modal if user is logged in
      if (user) {
        setIsOpen(true)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setIsOpen(true)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsOpen(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleDiscordClick = () => {
    window.open('https://discord.gg/ZBHuHEX3cE', '_blank')
  }

  const handleTwitterClick = () => {
    window.open('https://x.com/HonuaEcosystem', '_blank')
  }

  // Don't render if user is not logged in
  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg sm:max-w-xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          )}
        >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            🎉 Join Our Beta Community!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Help shape the future of Honua! Join our community to share feedback, get updates, and connect with other beta testers.
          </p>
          
          <div className="space-y-3">
            {/* Discord Button */}
            <Button 
              onClick={handleDiscordClick}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white"
              size="lg"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord Server
            </Button>
            
            {/* Twitter/X Button */}
            <Button 
              onClick={handleTwitterClick}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50"
              size="lg"
            >
              <Twitter className="mr-2 h-5 w-5" />
              Follow @HonuaEcosystem
            </Button>
          </div>
          
          <div className="pt-2">
            <Button 
              variant="ghost" 
              onClick={handleClose}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Maybe later
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            💡 Your feedback helps us build a better platform for everyone!
          </p>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}