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
    from: options.from || process.env.EMAIL_FROM || 'aalbinbabupaduppu@gmail.com', // Use user preference if not env
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
    <p>Thank you for choosing TaskFlow!</p>
  `;

  await sendEmail({
    email: customer.email,
    subject: customerSubject,
    message: customerMessage,
  });

  // --- 2. Email to Provider ---
  const providerSubject = `TaskFlow: NEW Booking Request for ${service.title}`;
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

/**
 * @desc Sends a ban notification to the user
 */
const sendBanNotification = async (user) => {
  const subject = 'TaskFlow: Account Suspension Notice';
  const message = `
    <h1>Account Suspended</h1>
    <p>Dear ${user.name},</p>
    <p>We are writing to inform you that your TaskFlow account has been suspended due to violations of our Terms of Service.</p>
    <p>If you believe this is an error, please contact our support team.</p>
    <p>Regards,<br>TaskFlow Team</p>
  `;

  await sendEmail({
    email: user.email,
    subject: subject,
    message: message,
    from: 'aalbinbabupaduppu@gmail.com'
  });
};

/**
 * @desc Sends dispute resolution emails to both parties
 */
const sendDisputeResolution = async (dispute, customer, providerUser) => {
  const subject = `TaskFlow: Dispute Resolved (Booking #${dispute.bookingId._id ? dispute.bookingId._id.toString().slice(-6) : 'N/A'})`;

  // 1. Email to Customer
  const customerMessage = `
    <h1>Dispute Update</h1>
    <p>Dear ${customer.name},</p>
    <p>The dispute regarding your booking has been reviewed and resolved.</p>
    <ul>
        <li><strong>Resolution Status:</strong> ${dispute.status.toUpperCase()}</li>
    </ul>
    <p>Thank you for your patience.</p>
    <p>Regards,<br>TaskFlow Team</p>
  `;

  await sendEmail({
    email: customer.email,
    subject: subject,
    message: customerMessage,
    from: 'aalbinbabupaduppu@gmail.com'
  });

  // 2. Email to Provider
  const providerMessage = `
    <h1>Dispute Update</h1>
    <p>Dear ${providerUser.name},</p>
    <p>The dispute regarding a booking has been reviewed and resolved.</p>
    <ul>
        <li><strong>Resolution Status:</strong> ${dispute.status.toUpperCase()}</li>
    </ul>
    <p>Regards,<br>TaskFlow Team</p>
  `;

  await sendEmail({
    email: providerUser.email,
    subject: subject,
    message: providerMessage,
    from: 'aalbinbabupaduppu@gmail.com'
  });
};


/**
 * @desc Sends an account deletion notification
 */
const sendDeletionNotification = async (user) => {
  const subject = 'TaskFlow: Account Deleted';
  const message = `
    <h1>Account Deleted</h1>
    <p>Dear ${user.name},</p>
    <p>Your TaskFlow account has been successfully deleted as per your request or administrative action.</p>
    <p>All your personal data, services, and profile information have been removed from our system.</p>
    <p>We are sorry to see you go. You are always welcome to join us again in the future.</p>
    <p>Regards,<br>TaskFlow Team</p>
  `;

  await sendEmail({
    email: user.email,
    subject: subject,
    message: message,
    from: 'aalbinbabupaduppu@gmail.com'
  });
};

/**
 * @desc Sends an account unban notification
 */
const sendUnbanNotification = async (user) => {
  const subject = 'TaskFlow: Account Restored';
  const message = `
    <h1>Welcome Back!</h1>
    <p>Dear ${user.name},</p>
    <p>We are pleased to inform you that your TaskFlow account has been reactivated.</p>
    <p>You can now log in and access all platform features again.</p>
    <p>If you have any questions, please contact our support team.</p>
    <p>Regards,<br>TaskFlow Team</p>
  `;

  await sendEmail({
    email: user.email,
    subject: subject,
    message: message,
    from: 'aalbinbabupaduppu@gmail.com'
  });
};

/**
 * @desc Sends a notification when a service is deleted by admin
 */
const sendServiceDeletedNotification = async (providerUser, serviceTitle) => {
  const subject = 'TaskFlow: Service Removed by Admin';
  const message = `
    <h1>Service Removed</h1>
    <p>Dear ${providerUser.name},</p>
    <p>We are writing to inform you that your service <strong>"${serviceTitle}"</strong> has been removed from TaskFlow by an administrator.</p>
    <p>This action typically occurs due to a violation of our listing policies or quality standards.</p>
    <p>If you believe this is an error, please contact support.</p>
    <p>Regards,<br>TaskFlow Team</p>
  `;

  await sendEmail({
    email: providerUser.email,
    subject: subject,
    message: message,
    from: 'aalbinbabupaduppu@gmail.com'
  });
};

/**
 * @desc Sends a notification when provider verification status changes
 */
const sendProviderStatusNotification = async (providerUser, isVerified) => {
  const subject = isVerified ? 'TaskFlow: You are now a Trusted Provider!' : 'TaskFlow: Verification Status Update';
  const message = isVerified ? `
    <h1>Congatulations! You are Verified! 🎉</h1>
    <p>Dear ${providerUser.name},</p>
    <p>Great news! Your provider profile has been reviewd and <strong>APPROVED</strong> by our admin team.</p>
    <p><strong>Benefits Unlocked:</strong></p>
    <ul>
        <li>Your new services are now Auto-Approved instantly.</li>
        <li>You have the "Trusted Provider" badge.</li>
        <li>Your pending services have been made LIVE.</li>
    </ul>
    <p>Keep up the great work!</p>
    <p>Regards,<br>TaskFlow Team</p>
  ` : `
    <h1>Verification Status Update</h1>
    <p>Dear ${providerUser.name},</p>
    <p>This is to inform you that your "Verified" status on TaskFlow has been revoked by an administrator.</p>
    <p>Your services have been temporarily set to "Pending" and will not be visible to customers until further notice.</p>
    <p>Please contact support to resolve any issues.</p>
    <p>Regards,<br>TaskFlow Team</p>
  `;

  await sendEmail({
    email: providerUser.email,
    subject: subject,
    message: message,
    from: 'aalbinbabupaduppu@gmail.com'
  });
};
/**
 * @desc Sends a notification to the customer when their booking is rescheduled due to a delay
 */
const sendRescheduleNotification = async (customer, booking, delayMinutes) => {
  const subject = 'TaskFlow: Important Update Regarding Your Appointment';

  const newTime = new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const message = `
    <h1>Appointment Delayed</h1>
    <p>Dear ${customer.name},</p>
    <p>We apologize for the inconvenience, but your appointment for today has been slightly delayed due to an unexpected overrun in a previous service.</p>
    <ul>
        <li><strong>New Start Time:</strong> ${newTime}</li>
        <li><strong>Delay:</strong> Approx. ${delayMinutes} minutes</li>
    </ul>
    <p>The provider is doing their best to reach you as soon as possible. Thank you for your patience.</p>
    <p>Regards,<br>TaskFlow Team</p>
  `;

  await sendEmail({
    email: customer.email,
    subject: subject,
    message: message,
    from: 'aalbinbabupaduppu@gmail.com'
  });
};

export {
  sendEmail,
  sendBookingConfirmation,
  sendBanNotification,
  sendUnbanNotification,
  sendDisputeResolution,
  sendDeletionNotification,
  sendServiceDeletedNotification,
  sendProviderStatusNotification,
  sendRescheduleNotification // Export new function
};