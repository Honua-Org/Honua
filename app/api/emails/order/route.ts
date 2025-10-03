import { NextRequest, NextResponse } from 'next/server'
import { 
  sendEmail, 
  generateOrderPlacedEmailForBuyer, 
  generateOrderPlacedEmailForSeller,
  generateOrderConfirmedEmail,
  generateOrderShippedEmail,
  generateOrderReceivedEmail,
  OrderEmailData 
} from '../../../utils/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, orderData }: { type: string, orderData: OrderEmailData } = body

    console.log(`Sending ${type} email for order ${orderData.orderId}`)

    let emailsSent = 0
    const results = []

    switch (type) {
      case 'order_placed':
        // Send email to buyer
        const buyerEmailResult = await sendEmail({
          to: orderData.buyerEmail,
          subject: `Order Confirmation - ${orderData.productTitle}`,
          html: generateOrderPlacedEmailForBuyer(orderData)
        })
        results.push({ recipient: 'buyer', success: buyerEmailResult })
        if (buyerEmailResult) emailsSent++

        // Send email to seller
        const sellerEmailResult = await sendEmail({
          to: orderData.sellerEmail,
          subject: `New Order Received - ${orderData.productTitle}`,
          html: generateOrderPlacedEmailForSeller(orderData)
        })
        results.push({ recipient: 'seller', success: sellerEmailResult })
        if (sellerEmailResult) emailsSent++
        break

      case 'order_confirmed':
        // Send email to buyer
        const buyerConfirmResult = await sendEmail({
          to: orderData.buyerEmail,
          subject: `Order Confirmed - ${orderData.productTitle}`,
          html: generateOrderConfirmedEmail(orderData, true)
        })
        results.push({ recipient: 'buyer', success: buyerConfirmResult })
        if (buyerConfirmResult) emailsSent++

        // Send email to seller
        const sellerConfirmResult = await sendEmail({
          to: orderData.sellerEmail,
          subject: `Order Confirmation Sent - ${orderData.productTitle}`,
          html: generateOrderConfirmedEmail(orderData, false)
        })
        results.push({ recipient: 'seller', success: sellerConfirmResult })
        if (sellerConfirmResult) emailsSent++
        break

      case 'order_shipped':
        // Send email to buyer
        const shippedResult = await sendEmail({
          to: orderData.buyerEmail,
          subject: `Order Shipped - ${orderData.productTitle}`,
          html: generateOrderShippedEmail(orderData)
        })
        results.push({ recipient: 'buyer', success: shippedResult })
        if (shippedResult) emailsSent++

        // Optionally notify seller that shipping email was sent
        const sellerShippedResult = await sendEmail({
          to: orderData.sellerEmail,
          subject: `Shipping Notification Sent - ${orderData.productTitle}`,
          html: `
            <h2>Shipping Notification Sent</h2>
            <p>Hi ${orderData.sellerName},</p>
            <p>The shipping notification for order ${orderData.orderId} has been sent to the customer.</p>
            <p>Order: ${orderData.productTitle}</p>
            <p>Customer: ${orderData.buyerName} (${orderData.buyerEmail})</p>
          `
        })
        results.push({ recipient: 'seller', success: sellerShippedResult })
        if (sellerShippedResult) emailsSent++
        break

      case 'order_received':
        // Send email to buyer
        const buyerReceivedResult = await sendEmail({
          to: orderData.buyerEmail,
          subject: `Thank You for Your Purchase - ${orderData.productTitle}`,
          html: generateOrderReceivedEmail(orderData, true)
        })
        results.push({ recipient: 'buyer', success: buyerReceivedResult })
        if (buyerReceivedResult) emailsSent++

        // Send email to seller
        const sellerReceivedResult = await sendEmail({
          to: orderData.sellerEmail,
          subject: `Order Completed - ${orderData.productTitle}`,
          html: generateOrderReceivedEmail(orderData, false)
        })
        results.push({ recipient: 'seller', success: sellerReceivedResult })
        if (sellerReceivedResult) emailsSent++
        break

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    console.log(`Email sending completed: ${emailsSent}/${results.length} emails sent successfully`)

    return NextResponse.json({
      success: true,
      emailsSent,
      totalEmails: results.length,
      results
    })

  } catch (error) {
    console.error('Error sending order emails:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}