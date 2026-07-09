/**
 * Email notification service.
 * Sends transactional emails for booking lifecycle events.
 *
 * Uses Nodemailer with the app's SMTP configuration.
 * Falls back to console logging in development if SMTP is not configured.
 */
import nodemailer from "nodemailer";
import { env } from "../config/env";

// ── SMTP Configuration ──

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@fixitnow.com";

const isConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Send an email. Falls back to console.log if SMTP is not configured.
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!transporter) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject} (SMTP not configured, logged only)`);
    console.log(`[EMAIL] Body: ${html.slice(0, 200)}...`);
    return;
  }

  await transporter.sendMail({
    from: `"FixItNow" <${FROM_ADDRESS}>`,
    to,
    subject,
    html,
  });
}

// ── Template Helpers ──

function baseHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
      .container { max-width: 600px; margin: 24px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
      .header { background: #2563eb; color: white; padding: 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 20px; }
      .body { padding: 24px; }
      .footer { padding: 16px 24px; background: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
      .badge-blue { background: #dbeafe; color: #1d4ed8; }
      .badge-green { background: #d1fae5; color: #065f46; }
      .badge-yellow { background: #fef3c7; color: #92400e; }
      .badge-red { background: #fee2e2; color: #991b1b; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
      td:first-child { font-weight: 600; color: #374151; width: 40%; }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🔧 FixItNow</h1></div>
        <div class="body">${content}</div>
        <div class="footer">FixItNow — Home Services Marketplace</div>
      </div>
    </body>
    </html>
  `;
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    REQUESTED: "badge-blue",
    ACCEPTED: "badge-green",
    DECLINED: "badge-red",
    PAID: "badge-green",
    IN_PROGRESS: "badge-yellow",
    COMPLETED: "badge-green",
    CANCELLED: "badge-red",
  };
  return `<span class="badge ${colors[status] || "badge-blue"}">${status}</span>`;
}

// ── Event-Specific Email Senders ──

export interface BookingEmailData {
  customerEmail: string;
  customerName: string;
  technicianName: string;
  serviceTitle: string;
  price: number;
  scheduledAt: string;
  address: string;
  bookingId: string;
  status: string;
}

/**
 * Notify the customer when a booking is created.
 */
export async function sendBookingCreated(
  data: BookingEmailData
): Promise<void> {
  const html = baseHtml(`
    <h2 style="margin-top:0">Booking Requested</h2>
    <p>Hi <strong>${data.customerName}</strong>,</p>
    <p>Your booking has been submitted and is awaiting the technician's response.</p>
    <table>
      <tr><td>Service</td><td>${data.serviceTitle}</td></tr>
      <tr><td>Technician</td><td>${data.technicianName}</td></tr>
      <tr><td>Scheduled</td><td>${new Date(data.scheduledAt).toLocaleString("en-BD")}</td></tr>
      <tr><td>Address</td><td>${data.address}</td></tr>
      <tr><td>Amount</td><td>BDT ${(data.price / 100).toFixed(2)}</td></tr>
      <tr><td>Status</td><td>${statusBadge(data.status)}</td></tr>
    </table>
    <p>You'll receive another email when the technician responds.</p>
  `);
  await sendEmail({
    to: data.customerEmail,
    subject: `Booking Requested — ${data.serviceTitle}`,
    html,
  });
}

/**
 * Notify both customer and technician when a booking is accepted.
 */
export async function sendBookingAccepted(
  data: BookingEmailData & { technicianEmail: string }
): Promise<void> {
  const html = (recipient: string) => baseHtml(`
    <h2 style="margin-top:0">Booking Accepted! ✅</h2>
    <p>Hi <strong>${recipient}</strong>,</p>
    <p>This booking has been accepted and is ready for payment.</p>
    <table>
      <tr><td>Service</td><td>${data.serviceTitle}</td></tr>
      <tr><td>Technician</td><td>${data.technicianName}</td></tr>
      <tr><td>Scheduled</td><td>${new Date(data.scheduledAt).toLocaleString("en-BD")}</td></tr>
      <tr><td>Address</td><td>${data.address}</td></tr>
      <tr><td>Amount</td><td>BDT ${(data.price / 100).toFixed(2)}</td></tr>
      <tr><td>Status</td><td>${statusBadge(data.status)}</td></tr>
    </table>
    <p>Please proceed to payment to confirm the booking.</p>
  `);

  await Promise.all([
    sendEmail({
      to: data.customerEmail,
      subject: `Booking Accepted — ${data.serviceTitle}`,
      html: html(data.customerName),
    }),
    sendEmail({
      to: data.technicianEmail,
      subject: `Booking Accepted — ${data.serviceTitle}`,
      html: html(data.technicianName),
    }),
  ]);
}

/**
 * Notify the customer when a booking is completed.
 */
export async function sendBookingCompleted(
  data: BookingEmailData
): Promise<void> {
  const html = baseHtml(`
    <h2 style="margin-top:0">Service Completed! 🎉</h2>
    <p>Hi <strong>${data.customerName}</strong>,</p>
    <p>Your service has been marked as completed. Thank you for choosing FixItNow!</p>
    <table>
      <tr><td>Service</td><td>${data.serviceTitle}</td></tr>
      <tr><td>Technician</td><td>${data.technicianName}</td></tr>
      <tr><td>Status</td><td>${statusBadge(data.status)}</td></tr>
    </table>
    <p>We'd love to hear your feedback! Please leave a review for your technician.</p>
  `);
  await sendEmail({
    to: data.customerEmail,
    subject: `Service Completed — ${data.serviceTitle}`,
    html,
  });
}

/**
 * Notify the customer when a booking is cancelled.
 */
export async function sendBookingCancelled(
  data: BookingEmailData
): Promise<void> {
  const html = baseHtml(`
    <h2 style="margin-top:0">Booking Cancelled</h2>
    <p>Hi <strong>${data.customerName}</strong>,</p>
    <p>Your booking has been cancelled.</p>
    <table>
      <tr><td>Service</td><td>${data.serviceTitle}</td></tr>
      <tr><td>Technician</td><td>${data.technicianName}</td></tr>
      <tr><td>Status</td><td>${statusBadge(data.status)}</td></tr>
    </table>
    <p>You can create a new booking anytime.</p>
  `);
  await sendEmail({
    to: data.customerEmail,
    subject: `Booking Cancelled — ${data.serviceTitle}`,
    html,
  });
}