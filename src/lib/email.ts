import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  if (!process.env.SMTP_HOST) return;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Reset Your Password — Islamic Investment App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">Password Reset Request</h2>
        <p>As-salamu alaykum ${name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#166534;color:#fff;border-radius:6px;text-decoration:none;margin:16px 0;">
          Reset Password
        </a>
        <p>This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
        <p style="color: #6b7280; font-size: 12px;">Islamic Investment Application</p>
      </div>
    `,
  });
}

export async function sendNewInvestmentEmail(to: string, name: string, investmentTitle: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'New Investment Assigned — Islamic Investment App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">New Investment Assigned</h2>
        <p>As-salamu alaykum ${name},</p>
        <p>A new investment has been assigned to you: <strong>${investmentTitle}</strong>.</p>
        <p style="color: #6b7280; font-size: 12px;">Islamic Investment Application</p>
      </div>
    `,
  });
}

export async function sendRepaymentReminderEmail(
  to: string,
  name: string,
  investmentTitle: string,
  dueDate: string,
  amount: string,
) {
  if (!process.env.SMTP_HOST) return;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Repayment Reminder — Islamic Investment App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">Repayment Reminder</h2>
        <p>As-salamu alaykum ${name},</p>
        <p>A repayment of <strong>${amount}</strong> for investment
        <strong>${investmentTitle}</strong> is due on <strong>${dueDate}</strong>.</p>
        <p>Please log in to your account for more details.</p>
        <p style="color: #6b7280; font-size: 12px;">Islamic Investment Application</p>
      </div>
    `,
  });
}

export async function sendOverdueAlertEmail(
  to: string,
  ownerName: string,
  investmentTitle: string,
  recipientName: string,
  dueDate: string,
  amount: string,
) {
  if (!process.env.SMTP_HOST) return;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Payment Overdue — Islamic Investment App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment Overdue</h2>
        <p>As-salamu alaykum ${ownerName},</p>
        <p>Repayment for <strong>${investmentTitle}</strong> (recipient: ${recipientName})
        was due on <strong>${dueDate}</strong>. Outstanding: <strong>${amount}</strong>.</p>
        <p>Please log in to record the payment or follow up with the recipient.</p>
        <p style="color: #6b7280; font-size: 12px;">Islamic Investment Application</p>
      </div>
    `,
  });
}
