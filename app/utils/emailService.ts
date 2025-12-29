import nodemailer from 'nodemailer'

export interface EmailData {
  to: string
  subject: string
  html: string
}

export interface OrderEmailData {
  orderId: string
  buyerName: string
  buyerEmail: string
  sellerName: string
  sellerEmail: string
  productTitle: string
  quantity: number
  totalPrice: number
  paymentMethod: string
  shippingAddress?: {
    full_name: string
    street: string
    city: string
    state: string
    zip: string
    country: string
    phone: string
    email: string
  }
}

// Create transporter (you'll need to configure this with your email service)
const createTransporter = () => {
  // For development, you can use a service like Gmail, SendGrid, or Mailgun
  // This is a basic configuration - you should use environment variables
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent successfully to ${emailData.to}`)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

// Email templates
export const generateOrderPlacedEmailForBuyer = (orderData: OrderEmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <h2>Hi ${orderData.buyerName},</h2>
          <p>Thank you for your order! We've received your purchase and it's being processed.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Product:</strong> ${orderData.productTitle}</p>
            <p><strong>Quantity:</strong> ${orderData.quantity}</p>
            <p><strong>Total:</strong> $${orderData.totalPrice}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
            ${orderData.shippingAddress ? `
              <h4>Shipping Address</h4>
              <p>${orderData.shippingAddress.full_name}<br>
              ${orderData.shippingAddress.street}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zip}<br>
              ${orderData.shippingAddress.country}<br>
              Phone: ${orderData.shippingAddress.phone}</p>
            ` : ''}
          </div>
          
          <p>You'll receive another email when your order is confirmed by the seller.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing our marketplace!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateOrderPlacedEmailForSeller = (orderData: OrderEmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Received</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
        .action-button { background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order Received!</h1>
        </div>
        <div class="content">
          <h2>Hi ${orderData.sellerName},</h2>
          <p>Great news! You've received a new order for your product.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Product:</strong> ${orderData.productTitle}</p>
            <p><strong>Quantity:</strong> ${orderData.quantity}</p>
            <p><strong>Total:</strong> $${orderData.totalPrice}</p>
            <p><strong>Payment Method:</strong> ${orderData.paymentMethod}</p>
            
            <h4>Customer Information</h4>
            <p><strong>Name:</strong> ${orderData.buyerName}</p>
            <p><strong>Email:</strong> ${orderData.buyerEmail}</p>
            
            ${orderData.shippingAddress ? `
              <h4>Shipping Address</h4>
              <p>${orderData.shippingAddress.full_name}<br>
              ${orderData.shippingAddress.street}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zip}<br>
              ${orderData.shippingAddress.country}<br>
              Phone: ${orderData.shippingAddress.phone}</p>
            ` : ''}
          </div>
          
          <p>Please log in to your seller dashboard to confirm this order.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketplace/dashboard" class="action-button">View Order</a>
        </div>
        <div class="footer">
          <p>Thank you for being part of our marketplace!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateOrderConfirmedEmail = (orderData: OrderEmailData, isForBuyer: boolean): string => {
  const title = isForBuyer ? 'Order Confirmed!' : 'Order Confirmation Sent'
  const greeting = isForBuyer ? `Hi ${orderData.buyerName}` : `Hi ${orderData.sellerName}`
  const message = isForBuyer 
    ? 'Great news! Your order has been confirmed by the seller and is being prepared for shipment.'
    : 'You have successfully confirmed the order. The customer has been notified.'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <h2>${greeting},</h2>
          <p>${message}</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Product:</strong> ${orderData.productTitle}</p>
            <p><strong>Quantity:</strong> ${orderData.quantity}</p>
            <p><strong>Total:</strong> $${orderData.totalPrice}</p>
          </div>
          
          <p>${isForBuyer ? "You'll receive another email when your order is shipped." : "Remember to update the order status when you ship the item."}</p>
        </div>
        <div class="footer">
          <p>Thank you for using our marketplace!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateOrderShippedEmail = (orderData: OrderEmailData, trackingNumber?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Shipped!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Order Has Been Shipped!</h1>
        </div>
        <div class="content">
          <h2>Hi ${orderData.buyerName},</h2>
          <p>Exciting news! Your order has been shipped and is on its way to you.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Product:</strong> ${orderData.productTitle}</p>
            <p><strong>Quantity:</strong> ${orderData.quantity}</p>
            ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
            
            <h4>Shipping Address</h4>
            ${orderData.shippingAddress ? `
              <p>${orderData.shippingAddress.full_name}<br>
              ${orderData.shippingAddress.street}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.zip}<br>
              ${orderData.shippingAddress.country}</p>
            ` : ''}
          </div>
          
          <p>Please confirm receipt of your order once it arrives.</p>
        </div>
        <div class="footer">
          <p>Thank you for your purchase!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateOrderReceivedEmail = (orderData: OrderEmailData, isForBuyer: boolean): string => {
  const title = isForBuyer ? 'Thank You for Confirming Receipt!' : 'Order Completed Successfully'
  const greeting = isForBuyer ? `Hi ${orderData.buyerName}` : `Hi ${orderData.sellerName}`
  const message = isForBuyer 
    ? 'Thank you for confirming that you received your order. We hope you love your purchase!'
    : 'Great news! The customer has confirmed receipt of their order. This transaction is now complete.'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <h2>${greeting},</h2>
          <p>${message}</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p><strong>Product:</strong> ${orderData.productTitle}</p>
            <p><strong>Quantity:</strong> ${orderData.quantity}</p>
            <p><strong>Total:</strong> $${orderData.totalPrice}</p>
          </div>
          
          <p>${isForBuyer ? "Don't forget to leave a review to help other customers!" : "Thank you for providing excellent service to our customers."}</p>
        </div>
        <div class="footer">
          <p>Thank you for being part of our marketplace community!</p>
        </div>
      </div>
    </body>
    </html>
  `
}