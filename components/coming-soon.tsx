'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Clock, Mail, Sparkles, Rocket, Bell, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface ComingSoonProps {
  title?: string
  description?: string
  expectedDate?: string
  features?: string[]
  showNotifyMe?: boolean
  className?: string
}

export default function ComingSoon({
  title = "Something Amazing is Coming",
  description = "We're working hard to bring you an incredible new experience. Stay tuned for updates!",
  expectedDate,
  features = [],
  showNotifyMe = true,
  className = ""
}: ComingSoonProps) {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // Countdown timer effect
  useEffect(() => {
    if (!expectedDate) return

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const target = new Date(expectedDate).getTime()
      const difference = target - now

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expectedDate])

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to get notified.",
        variant: "destructive"
      })
      return
    }

    // Here you would typically save the email to your database
    // For now, we'll just show a success message
    setIsSubscribed(true)
    toast({
      title: "You're on the list! 🎉",
      description: "We'll notify you as soon as this feature is ready.",
    })
    setEmail('')
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 ${className}`}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto text-center space-y-8"
      >
        {/* Animated Icon */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Rocket className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </motion.div>

        {/* Countdown Timer */}
        {expectedDate && (
          <motion.div variants={itemVariants}>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Launch Countdown
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(timeLeft).map(([unit, value]) => (
                    <div key={unit} className="text-center">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-3 mb-2">
                        <span className="text-2xl md:text-3xl font-bold">
                          {value.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {unit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Features Preview */}
        {features.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              What to Expect
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Notify Me Form */}
        {showNotifyMe && !isSubscribed && (
          <motion.div variants={itemVariants}>
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Bell className="w-5 h-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Get Notified
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Be the first to know when this feature launches!
                </p>
                <form onSubmit={handleNotifyMe} className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success Message */}
        {isSubscribed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-md mx-auto"
          >
            <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300">
              <Mail className="w-5 h-5" />
              <span className="font-medium">You're all set! We'll be in touch soon.</span>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div variants={itemVariants} className="pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Follow us on social media for the latest updates
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}