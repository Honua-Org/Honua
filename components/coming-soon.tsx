'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, Sparkles, Rocket } from 'lucide-react'
import { motion } from 'framer-motion'

interface ComingSoonProps {
  title?: string
  description?: string
  className?: string
}

export default function ComingSoon({
  title = "Something Amazing is Coming",
  description = "We're working hard to bring you an incredible new experience. Stay tuned for updates!",
  className = ""
}: ComingSoonProps) {

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
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${className}`}>
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
              className="w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <Rocket className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 text-accent-foreground" />
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </motion.div>



        {/* Footer */}
        <motion.div variants={itemVariants} className="pt-8">
          <p className="text-sm text-muted-foreground">
            Follow us on social media for the latest updates
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}