import ComingSoon from '@/components/coming-soon'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ComingSoonDemo() {
  // Example: Set a date 30 days from now
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30)

  const features = [
    "Advanced Analytics Dashboard",
    "Real-time Collaboration Tools",
    "AI-Powered Insights",
    "Mobile App Integration",
    "Enhanced Security Features",
    "Custom Workflow Builder"
  ]

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
        title="Marketplace is Coming!"
        description="We're building an amazing marketplace where organizations can showcase and sell their sustainable products. Get ready for a revolutionary shopping experience that puts the planet first."
        expectedDate={futureDate.toISOString()}
        features={features}
        showNotifyMe={true}
      />
    </div>
  )
}

export const metadata = {
  title: 'Coming Soon - Honua Social',
  description: 'Something amazing is coming to Honua Social. Stay tuned!',
}