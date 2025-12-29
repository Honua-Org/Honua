"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSession } from "@supabase/auth-helpers-react"
import MainLayout from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Upload,
  X,
  DollarSign,
  Leaf,
  MapPin,
  Package,
  Monitor,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

type ProductFormData = {
  title: string
  description: string
  price: number
  currency: string
  category: string
  type: 'physical' | 'digital' | 'service'
  images: File[]
  location: string
  green_points_price: number
  sustainability_features: string[]
  tags: string[]
  shipping_info: string
  digital_delivery_info: string
  service_duration: string
  service_location_type: 'remote' | 'in-person' | 'both'
  initial_stock: number
  low_stock_threshold: number
  reorder_point: number
}

const categories = [
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "home", name: "Home & Garden", icon: "🏠" },
  { id: "clothing", name: "Sustainable Fashion", icon: "👕" },
  { id: "food", name: "Organic Food", icon: "🥬" },
  { id: "consulting", name: "Consulting", icon: "💡" },
  { id: "software", name: "Software", icon: "💻" },
  { id: "education", name: "Education", icon: "📚" },
  { id: "health", name: "Health & Wellness", icon: "🌿" },
  { id: "transport", name: "Transportation", icon: "🚲" },
  { id: "energy", name: "Renewable Energy", icon: "⚡" }
]

const sustainabilityFeatures = [
  "Made from recycled materials",
  "Carbon neutral shipping",
  "Biodegradable packaging",
  "Locally sourced",
  "Fair trade certified",
  "Renewable energy powered",
  "Zero waste production",
  "Organic materials",
  "Plastic-free",
  "Refillable/Reusable"
]

export default function SellProductPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: 0,
    currency: "USD",
    category: "",
    type: "physical",
    images: [],
    location: "",
    green_points_price: 0,
    sustainability_features: [],
    tags: [],
    shipping_info: "",
    digital_delivery_info: "",
    service_duration: "",
    service_location_type: "remote",
    initial_stock: 0,
    low_stock_threshold: 10,
    reorder_point: 5
  })
  
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [tagInput, setTagInput] = useState("")
  
  const router = useRouter()
  const session = useSession()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
    }
  }, [session, router])

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + formData.images.length > 5) {
      toast.error("Maximum 5 images allowed")
      return
    }

    const newImages = [...formData.images, ...files]
    setFormData(prev => ({ ...prev, images: newImages }))

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index)
    
    setFormData(prev => ({ ...prev, images: newImages }))
    setImagePreviewUrls(newPreviewUrls)
  }

  const handleSustainabilityFeatureToggle = (feature: string) => {
    const isSelected = formData.sustainability_features.includes(feature)
    const newFeatures = isSelected
      ? formData.sustainability_features.filter(f => f !== feature)
      : [...formData.sustainability_features, feature]
    
    handleInputChange('sustainability_features', newFeatures)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    handleInputChange('tags', formData.tags.filter(t => t !== tag))
  }

  const calculateGreenPoints = () => {
    // Simple calculation: base price * sustainability multiplier
    const sustainabilityMultiplier = 1 + (formData.sustainability_features.length * 0.1)
    return Math.round(formData.price * 5 * sustainabilityMultiplier)
  }

  useEffect(() => {
    if (formData.price > 0) {
      handleInputChange('green_points_price', calculateGreenPoints())
    }
  }, [formData.price, formData.sustainability_features])

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.category && formData.type
      case 2:
        return formData.price > 0
      case 3:
        return formData.images.length > 0
      default:
        return true
    }
  }

  const uploadImages = async (images: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `marketplace-products/${session?.user?.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, image)
      
      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)
      
      uploadedUrls.push(publicUrl)
    }
    
    return uploadedUrls
  }

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to sell products")
      return
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate stock values for physical products
    if (formData.type === 'physical') {
      if (formData.initial_stock === undefined || formData.initial_stock < 0) {
        toast.error("Please enter a valid initial stock quantity (0 or greater)")
        return
      }
      if (formData.low_stock_threshold !== undefined && formData.low_stock_threshold < 0) {
        toast.error("Low stock threshold must be 0 or greater")
        return
      }
      if (formData.reorder_point !== undefined && formData.reorder_point < 0) {
        toast.error("Reorder point must be 0 or greater")
        return
      }
    }

    setIsSubmitting(true)
    
    try {
      // 1. Upload images to Supabase storage
      const imageUrls = await uploadImages(formData.images)
      
      // 2. Create product record using API
      const productData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        category: formData.category,
        type: formData.type,
        images: imageUrls,
        location: formData.location,
        green_points_price: formData.green_points_price,
        sustainability_features: formData.sustainability_features,
        tags: formData.tags,
        shipping_info: formData.shipping_info,
        digital_delivery_info: formData.digital_delivery_info,
        service_duration: formData.service_duration,
        service_location_type: formData.service_location_type,
        initial_stock: formData.initial_stock,
        low_stock_threshold: formData.low_stock_threshold,
        reorder_point: formData.reorder_point
      }
      
      console.log('Sending product data:', productData)
      
      const response = await fetch('/api/marketplace/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })

      console.log('API Response status:', response.status)
      console.log('API Response headers:', response.headers)
      
      const result = await response.json()
      console.log('API Response data:', result)

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to create product'
        console.error('API Error:', errorMessage)
        throw new Error(errorMessage)
      }

      toast.success('Product created successfully!')
      router.push('/marketplace')
    } catch (error) {
      console.error('Error submitting product:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to list product. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: "Basic Info", description: "Product details" },
    { number: 2, title: "Pricing", description: "Set your price" },
    { number: 3, title: "Images", description: "Add photos" },
    { number: 4, title: "Sustainability", description: "Green features" },
    { number: 5, title: "Review", description: "Final check" }
  ]

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 pb-20 lg:pb-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            List Your Product or Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your sustainable products and services with the Honua community
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between overflow-x-auto">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-max">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium flex-shrink-0 ${
                      currentStep >= step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="ml-2 hidden sm:block">
                      <div className="text-sm font-medium whitespace-nowrap">{step.title}</div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">{step.description}</div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 flex-shrink-0 ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Product/Service Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a clear, descriptive title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product or service in detail..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={(value: 'physical' | 'digital' | 'service') => handleInputChange('type', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">
                          <Package className="w-4 h-4 mr-2" />
                          Physical Product
                        </SelectItem>
                        <SelectItem value="digital">
                          <Monitor className="w-4 h-4 mr-2" />
                          Digital Product
                        </SelectItem>
                        <SelectItem value="service">
                          <Users className="w-4 h-4 mr-2" />
                          Service
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === 'physical' && (
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="location"
                        placeholder="City, State/Country"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                {formData.type === 'service' && (
                  <div>
                    <Label htmlFor="service-location">Service Location Type</Label>
                    <Select value={formData.service_location_type} onValueChange={(value: 'remote' | 'in-person' | 'both') => handleInputChange('service_location_type', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">Remote Only</SelectItem>
                        <SelectItem value="in-person">In-Person Only</SelectItem>
                        <SelectItem value="both">Both Remote & In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Pricing */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.price || ''}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Green Points Alternative
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    Allow customers to pay with Green Points earned through sustainable actions
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-green-600">
                      {formData.green_points_price}
                    </span>
                    <span className="text-green-600">Green Points</span>
                    <Badge variant="secondary" className="ml-2">
                      Auto-calculated
                    </Badge>
                  </div>
                </div>

                {formData.type === 'service' && (
                  <div>
                    <Label htmlFor="service-duration">Service Duration</Label>
                    <Input
                      id="service-duration"
                      placeholder="e.g., 1 hour, 2 days, 1 week"
                      value={formData.service_duration}
                      onChange={(e) => handleInputChange('service_duration', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {formData.type === 'physical' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Package className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        Inventory Management
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="initial-stock">Initial Stock Quantity *</Label>
                        <Input
                          id="initial-stock"
                          type="number"
                          min="0"
                          max="999999"
                          placeholder="0"
                          value={formData.initial_stock || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value >= 0) {
                              handleInputChange('initial_stock', value);
                            }
                          }}
                          className="mt-1"
                          required
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          How many units do you have in stock?
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="low-stock-threshold">Low Stock Alert</Label>
                        <Input
                          id="low-stock-threshold"
                          type="number"
                          min="0"
                          max="999999"
                          placeholder="10"
                          value={formData.low_stock_threshold || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value >= 0) {
                              handleInputChange('low_stock_threshold', value);
                            }
                          }}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Get notified when stock is low
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="reorder-point">Reorder Point</Label>
                        <Input
                          id="reorder-point"
                          type="number"
                          min="0"
                          max="999999"
                          placeholder="5"
                          value={formData.reorder_point || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value >= 0) {
                              handleInputChange('reorder_point', value);
                            }
                          }}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          When to reorder inventory
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Images */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label>Product Images *</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Upload up to 5 high-quality images. First image will be the main photo.
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop images here, or click to browse
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="image-upload" className="cursor-pointer">
                        Choose Images
                      </label>
                    </Button>
                  </div>
                </div>

                {imagePreviewUrls.length > 0 && (
                  <div>
                    <Label>Image Preview</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative overflow-hidden rounded-lg border">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {index === 0 && (
                              <Badge className="absolute top-2 left-2 bg-blue-500">
                                Main
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Sustainability */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label>Sustainability Features</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Highlight what makes your product or service environmentally friendly
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sustainabilityFeatures.map(feature => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={feature}
                          checked={formData.sustainability_features.includes(feature)}
                          onCheckedChange={() => handleSustainabilityFeatureToggle(feature)}
                        />
                        <Label htmlFor={feature} className="text-sm">
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Add relevant tags to help customers find your product
                  </p>
                  
                  <div className="flex space-x-2 mb-2">
                    <Input
                      id="tags"
                      placeholder="Enter a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button onClick={addTag} disabled={!tagInput.trim()}>
                      Add
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <button onClick={() => removeTag(tag)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      Review Your Listing
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Please review all information before publishing your listing
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Title:</strong> {formData.title}</div>
                        <div><strong>Category:</strong> {categories.find(c => c.id === formData.category)?.name}</div>
                        <div><strong>Type:</strong> {formData.type}</div>
                        <div><strong>Price:</strong> ${formData.price} ({formData.green_points_price} GP)</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Description</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formData.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Images ({formData.images.length})</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviewUrls.slice(0, 3).map((url, index) => (
                          <div key={index} className="aspect-square relative overflow-hidden rounded border">
                            <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Sustainability Features</h3>
                      <div className="flex flex-wrap gap-1">
                        {formData.sustainability_features.map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <Separator className="my-6" />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep(currentStep)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Listing'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}