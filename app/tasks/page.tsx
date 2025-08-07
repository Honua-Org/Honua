import ComingSoon from '@/components/coming-soon'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ComingSoonDemo() {
  return (
    <div className="relative">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Coming Soon Component */}
      <ComingSoon
        title="Tasks Coming Soon"
        description="We're building something incredible for our community. Get ready for a revolutionary marketplace experience that will transform how you connect and trade."
      />
    </div>
  )
}

export const metadata = {
  title: 'Coming Soon - Honua Social',
  description: 'Something amazing is coming to Honua Social. Stay tuned!',
}
