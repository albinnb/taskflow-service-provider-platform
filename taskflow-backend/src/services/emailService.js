import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

/**
 * @desc Create Nodemailer transporter using SMTP settings from .env
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * @desc Sends a generic email
 * @param {object} options - { email, subject, message }
 */
const sendEmail = async (options) => {
  // Check if email is configured
  if (!process.env.SMTP_HOST) {
    console.warn(`EMAIL NOT SENT: SMTP not configured. Subject: ${options.subject}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

/**
 * @desc Sends a booking confirmation email to customer and provider
 */
const sendBookingConfirmation = async (customer, providerUser, booking, service) => {
  const formattedDate = new Date(booking.scheduledAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // --- 1. Email to Customer ---
  const customerSubject = `LocalLink: Booking Confirmed for ${service.title}`;
  const customerMessage = `
    <h1>Booking Confirmation</h1>
    <p>Dear ${customer.name},</p>
    <p>Your booking details are as follows:</p>
    <ul>
        <li><strong>Service:</strong> ${service.title}</li>
        <li><strong>Provider:</strong> ${providerUser.name}</li>
        <li><strong>Scheduled Time:</strong> ${formattedDate}</li>
        <li><strong>Duration:</strong> ${booking.durationMinutes} minutes</li>
        <li><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</li>
        <li><strong>Status:</strong> ${booking.status.toUpperCase()}</li>
    </ul>
    <p>The provider will contact you shortly to confirm the details.</p>
    <p>Thank you for choosing LocalLink!</p>
  `;

  await sendEmail({
    email: customer.email,
    subject: customerSubject,
    message: customerMessage,
  });

  // --- 2. Email to Provider ---
  const providerSubject = `LocalLink: NEW Booking Request for ${service.title}`;
  const providerMessage = `
    <h1>New Booking Alert!</h1>
    <p>Dear ${providerUser.name},</p>
    <p>You have received a new booking request from ${customer.name}.</p>
    <ul>
        <li><strong>Service:</strong> ${service.title}</li>
        <li><strong>Customer Email:</strong> ${customer.email}</li>
        <li><strong>Scheduled Time:</strong> ${formattedDate}</li>
        <li><strong>Status:</strong> ${booking.status.toUpperCase()} (Action Required)</li>
    </ul>
    <p>Please log in to your dashboard to confirm or decline the booking.</p>
  `;

  await sendEmail({
    email: providerUser.email,
    subject: providerSubject,
    message: providerMessage,
  });
};

export { sendEmail, sendBookingConfirmation };