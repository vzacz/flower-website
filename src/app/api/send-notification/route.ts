import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for sending notifications
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, type, data } = body;

    if (!to || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let subject = '';
    let htmlContent = '';

    if (type === 'payment_received') {
      subject = `Payment Received - Invoice ${data.invoiceNumber}`;
      htmlContent = `
        <h1>Payment Received</h1>
        <p>Dear ${data.customerName},</p>
        <p>We have received your payment of <strong>$${data.amountPaid.toFixed(2)}</strong> for Invoice ${data.invoiceNumber}.</p>
        <p>Thank you for your prompt payment!</p>
        <p>Best regards,<br>Alchemy Fruit Distribution</p>
      `;
    } else if (type === 'order_confirmed') {
      subject = `Order Confirmed - ${data.orderNumber}`;
      htmlContent = `
        <h1>Order Confirmed</h1>
        <p>Dear ${data.customerName},</p>
        <p>Your order has been confirmed!</p>
        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p><strong>Delivery Date:</strong> ${data.deliveryDate}</p>
        <p>We will deliver your order on the scheduled date.</p>
        <p>Best regards,<br>Alchemy Fruit Distribution</p>
      `;
    } else if (type === 'delivery_reminder') {
      subject = `Delivery Reminder - ${data.orderNumber}`;
      htmlContent = `
        <h1>Delivery Reminder</h1>
        <p>Dear ${data.customerName},</p>
        <p>We wanted to remind you that your order will be delivered tomorrow.</p>
        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p><strong>Estimated Delivery Time:</strong> ${data.deliveryTime}</p>
        <p>Please ensure someone is available to receive the delivery.</p>
        <p>Best regards,<br>Alchemy Fruit Distribution</p>
      `;
    }

    // Placeholder for testing
    console.log('Notification would be sent to:', to);
    console.log('Type:', type);
    console.log('Subject:', subject);

    return NextResponse.json({
      success: true,
      message: 'Notification queued for sending',
      email: to,
      type,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
