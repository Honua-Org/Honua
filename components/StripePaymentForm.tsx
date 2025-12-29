"use client"

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Shield, Lock, CreditCard, Smartphone, X } from 'lucide-react'
import { toast } from 'sonner'

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentFormProps {
  clientSecret: string
  orderId: string
  amount: number
  currency?: string
  productName?: string
  onSuccess: () => void
  onCancel?: () => void
  isLoading?: boolean
}

interface PaymentFormProps extends StripePaymentFormProps {
  // All props are passed through
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  orderId,
  amount,
  currency = 'USD',
  productName,
  onSuccess,
  onCancel,
  isLoading = false
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [paymentRequest, setPaymentRequest] = useState<any>(null)
  const [canMakePayment, setCanMakePayment] = useState(false)

  // Initialize Payment Request for Apple Pay, Google Pay, etc.
  useEffect(() => {
    if (!stripe) return

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: currency.toLowerCase(),
      total: {
        label: productName || 'Order Total',
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
    })

    // Check if Payment Request is available
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr)
        setCanMakePayment(true)
      }
    })

    // Handle digital wallet payments (Apple Pay, Google Pay) - Only when user explicitly clicks
    pr.on('paymentmethod', async (event) => {
      setProcessing(true)
      
      try {
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: event.paymentMethod.id,
          },
          { handleActions: false }
        )

        if (error) {
          event.complete('fail')
          toast.error(error.message || 'Payment failed')
        } else {
          event.complete('success')
          if (paymentIntent.status === 'requires_action') {
            const { error: confirmError } = await stripe.confirmCardPayment(clientSecret)
            if (confirmError) {
              toast.error(confirmError.message || 'Payment confirmation failed')
            } else {
              onSuccess()
              toast.success('Payment successful!')
            }
          } else {
            onSuccess()
            toast.success('Payment successful!')
          }
        }
      } catch (err) {
        event.complete('fail')
        console.error('Payment error:', err)
        toast.error('An unexpected error occurred during payment')
      } finally {
        setProcessing(false)
      }
    })
  }, [stripe, clientSecret, amount, currency, productName, onSuccess])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Enhanced validation checks
    console.log('=== STRIPE INITIALIZATION CHECK ===', {
      stripeLoaded: !!stripe,
      elementsLoaded: !!elements,
      clientSecretExists: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      orderId,
      timestamp: new Date().toISOString()
    })

    if (!stripe) {
      console.error('Stripe not initialized - stripe object is null/undefined')
      toast.error('Stripe has not loaded yet. Please refresh the page and try again.')
      return
    }

    if (!elements) {
      console.error('Elements not initialized - elements object is null/undefined')
      toast.error('Payment form has not loaded properly. Please refresh the page and try again.')
      return
    }

    if (!clientSecret) {
      console.error('Client secret is missing or empty')
      toast.error('Payment setup incomplete. Please try again.')
      return
    }

    setProcessing(true)

    try {
      console.log('=== STRIPE PAYMENT CONFIRMATION STARTED ===', {
        clientSecret: clientSecret ? clientSecret.substring(0, 20) + '...' : 'NONE',
        orderId,
        returnUrl: `${window.location.origin}/marketplace/orders/${orderId}`,
        timestamp: new Date().toISOString()
      })

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/marketplace/orders/${orderId}`,
        },
        redirect: 'if_required',
      })

      // Enhanced error logging
      console.log('=== STRIPE PAYMENT CONFIRMATION RESULT ===', {
        hasError: !!error,
        errorType: error?.type,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDeclineCode: error?.decline_code,
        errorParam: error?.param,
        errorSource: error?.source,
        paymentIntentStatus: paymentIntent?.status,
        paymentIntentId: paymentIntent?.id,
        paymentIntentClientSecret: paymentIntent?.client_secret ? paymentIntent.client_secret.substring(0, 20) + '...' : 'NONE',
        timestamp: new Date().toISOString()
      })

      if (error) {
        // Log the complete error object for debugging
        console.error('=== FULL ERROR OBJECT ===')
        console.error('Full error object:', error)
        console.error('Error type:', error.type)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error decline_code:', error.decline_code)
        console.error('Error param:', error.param)
        console.error('Error source:', error.source)
        console.error('Error payment_method:', error.payment_method)
        console.error('Error request_log_url:', error.request_log_url)
        console.error('=== END FULL ERROR OBJECT ===')
        
        // Handle specific error types with more detailed messaging
        if (error.type === 'card_error') {
          const cardErrorMsg = error.decline_code 
            ? `Card Error (${error.decline_code}): ${error.message}`
            : `Card Error: ${error.message}`
          console.error('Card error details:', { decline_code: error.decline_code, message: error.message })
          toast.error(cardErrorMsg)
        } else if ((error as any).type === 'authentication_required') {
          console.error('Authentication required error')
          toast.error('Authentication required. Please try again or use a different payment method.')
        } else if (error.type === 'validation_error') {
          console.error('Validation error:', error.message)
          toast.error(`Validation Error: ${error.message}`)
        } else if (error.type === 'api_error') {
          console.error('API error:', error.message)
          toast.error('Payment service temporarily unavailable. Please try again.')
        } else if (error.type === 'rate_limit_error') {
          console.error('Rate limit error:', error.message)
          toast.error('Too many requests. Please wait a moment and try again.')
        } else {
          console.error('Unknown error type:', error.type, error.message)
          toast.error(error.message || 'Payment failed - please try again')
        }
      } else if (paymentIntent) {
        console.log('=== PAYMENT INTENT DETAILS ===', {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method,
          created: paymentIntent.created,
          timestamp: new Date().toISOString()
        })

        if (paymentIntent.status === 'succeeded') {
          console.log('Payment succeeded!')
          onSuccess()
          toast.success('Payment successful!')
        } else if (paymentIntent.status === 'requires_action') {
          console.warn('Payment requires additional action after confirmation')
          toast.error('Payment requires additional authentication. Please try again.')
        } else if (paymentIntent.status === 'processing') {
          console.log('Payment is processing')
          toast.success('Payment is being processed. You will receive a confirmation shortly.')
          onSuccess()
        } else {
          console.warn('Unexpected payment status:', paymentIntent.status)
          toast.error(`Payment status: ${paymentIntent.status}. Please contact support.`)
        }
      } else {
        console.error('No error and no paymentIntent returned - this should not happen')
        toast.error('Unexpected response from payment service. Please try again.')
      }
    } catch (err) {
      console.error('=== PAYMENT EXCEPTION CAUGHT ===')
      console.error('Exception type:', typeof err)
      console.error('Exception message:', err instanceof Error ? err.message : 'Unknown error')
      console.error('Exception stack:', err instanceof Error ? err.stack : 'No stack trace')
      console.error('Full exception object:', err)
      console.error('=== END PAYMENT EXCEPTION ===')
      
      toast.error('An unexpected error occurred during payment. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-4 duration-300">
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Complete Payment
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Order ID: {orderId}
              </p>
            </div>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={processing || isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Amount Display */}
          <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {productName || 'Total Amount'}
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(amount, currency)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Responsive Layout Container */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Payment Methods (Mobile: Full Width, Desktop: Left Side) */}
            <div className="flex-1 space-y-6">
              {/* Digital Wallet Payment Options */}
              {canMakePayment && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Smartphone className="h-4 w-4" />
                    Quick Payment Options
                  </div>
                  
                  {/* Digital Wallet Buttons */}
                  <div className="space-y-3">
                    {paymentRequest && (
                      <div className="relative">
                        <PaymentRequestButtonElement
                          options={{
                            paymentRequest,
                            style: {
                              paymentRequestButton: {
                                type: 'default',
                                theme: 'dark',
                                height: '48px',
                              },
                            },
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                        Or pay with card
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card Payment Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <CreditCard className="h-4 w-4" />
                    Payment Details
                  </div>
                  
                  <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                    <PaymentElement
                      options={{
                        layout: 'tabs',
                        paymentMethodOrder: ['card'],
                        fields: {
                          billingDetails: 'auto'
                        },
                        terms: {
                          card: 'never'
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Important Notice */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">Secure Payment</p>
                      <p className="text-xs mt-1">Your card will only be charged when you click the "Pay" button below. Simply entering your card details will not process any payment.</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={processing || isLoading}
                      className="flex-1 h-12 font-medium"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={!stripe || processing || isLoading}
                    className="flex-1 h-12 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {processing || isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Pay {formatAmount(amount, currency)} Now
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Right Column - Security & Trust Info (Mobile: Full Width, Desktop: Right Side) */}
            <div className="flex-1 lg:max-w-sm space-y-6">
              {/* Security Badges */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Security & Trust
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>SSL Secured Connection</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>256-bit Encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>PCI DSS Compliant</span>
                  </div>
                </div>
                <Badge variant="outline" className="w-full justify-center text-xs py-2 border-primary/20 text-primary">
                  Powered by Stripe
                </Badge>
              </div>

              {/* Trust Indicators */}
              <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-center text-xs text-gray-600 dark:text-gray-400 space-y-2">
                  <p className="font-medium">Your payment is secure</p>
                  <p>We never store your card details</p>
                  <p>All transactions are encrypted</p>
                  <p className="font-medium text-primary">No charge until you click "Pay"</p>
                </div>
              </div>

              {/* Payment Process Steps */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Process
                </h3>
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Enter your payment details</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Review your order</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Click "Pay" to complete purchase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    <span>Receive order confirmation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const [stripeLoaded, setStripeLoaded] = useState(false)

  useEffect(() => {
    stripePromise.then((stripe) => {
      if (stripe) {
        setStripeLoaded(true)
      } else {
        toast.error('Failed to load Stripe')
      }
    })
  }, [])

  if (!stripeLoaded) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md mx-auto shadow-2xl">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="font-medium">Loading secure payment form...</p>
                <p className="text-sm text-muted-foreground">
                  Powered by Stripe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stripeOptions = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(142.1, 76.2%, 36.3%)', // Using CSS custom property value for primary color
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <PaymentForm {...props} />
    </Elements>
  )
}

export default StripePaymentForm