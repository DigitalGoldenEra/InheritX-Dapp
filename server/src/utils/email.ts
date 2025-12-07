/**
 * Email Service
 * Handles sending emails for notifications, claims, etc.
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_FROM || 'InheritX <noreply@inheritx.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Send an email
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html: html || text,
    });

    logger.info(`Email sent: ${info.messageId}`, { to, subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send claim notification to beneficiary
 */
export async function sendClaimNotification(
  beneficiaryEmail: string,
  beneficiaryName: string,
  planName: string,
  claimCode: string,
  amount: string,
  assetType: string,
  claimUrl: string
): Promise<boolean> {
  const subject = `InheritX: You Have an Inheritance to Claim - ${planName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0D1A1E 0%, #1C252A 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: #33C5E0; margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .claim-box { background: #fff; border: 2px solid #33C5E0; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .claim-code { font-size: 32px; font-weight: bold; color: #33C5E0; letter-spacing: 5px; margin: 15px 0; }
        .amount { font-size: 24px; color: #0D1A1E; font-weight: bold; }
        .btn { display: inline-block; background: #33C5E0; color: #0D1A1E; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>InheritX</h1>
          <p style="color: #a0aec0; margin: 10px 0 0 0;">Secure Digital Inheritance</p>
        </div>
        <div class="content">
          <h2>Hello ${beneficiaryName},</h2>
          <p>You have been designated as a beneficiary in an inheritance plan. The assets are now ready for you to claim.</p>
          
          <div class="claim-box">
            <p style="margin: 0; color: #666;">Plan Name</p>
            <h3 style="margin: 5px 0 20px 0;">${planName}</h3>
            
            <p style="margin: 0; color: #666;">Your Inheritance Amount</p>
            <p class="amount">${amount} ${assetType}</p>
            
            <p style="margin: 20px 0 5px 0; color: #666;">Your Claim Code</p>
            <p class="claim-code">${claimCode}</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> Keep this claim code secure. Anyone with this code and your personal details can claim the inheritance.
          </div>
          
          <p style="text-align: center;">
            <a href="${claimUrl}" class="btn">Claim Your Inheritance</a>
          </p>
          
          <h3>How to Claim:</h3>
          <ol>
            <li>Click the "Claim Your Inheritance" button above</li>
            <li>Connect your cryptocurrency wallet</li>
            <li>Enter the claim code shown above</li>
            <li>Verify your identity details</li>
            <li>Confirm the transaction to receive your assets</li>
          </ol>
          
          <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>This email was sent by InheritX - Secure Digital Inheritance Platform</p>
          <p>© ${new Date().getFullYear()} InheritX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${beneficiaryName},

You have been designated as a beneficiary in an inheritance plan. The assets are now ready for you to claim.

Plan Name: ${planName}
Your Inheritance Amount: ${amount} ${assetType}

YOUR CLAIM CODE: ${claimCode}

IMPORTANT: Keep this claim code secure. Anyone with this code and your personal details can claim the inheritance.

To claim your inheritance:
1. Visit: ${claimUrl}
2. Connect your cryptocurrency wallet
3. Enter the claim code shown above
4. Verify your identity details
5. Confirm the transaction to receive your assets

If you have any questions, please contact our support team.

© ${new Date().getFullYear()} InheritX. All rights reserved.
  `;

  return sendEmail(beneficiaryEmail, subject, text, html);
}

/**
 * Send KYC approval notification
 */
export async function sendKYCApprovalNotification(
  email: string,
  name: string
): Promise<boolean> {
  const subject = 'Your KYC Has Been Approved ✓';
  
  const text = `Hi ${name},

Great news! Your KYC verification has been approved.

You can now create inheritance plans on InheritX.

Get started: ${FRONTEND_URL}/dashboard/plans

Thanks,
The InheritX Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10B981;">✓ KYC Approved</h2>
      
      <p>Hi ${name},</p>
      
      <p>Great news! Your KYC verification has been <strong>approved</strong>.</p>
      
      <p>You can now create inheritance plans on InheritX.</p>
      
      <p style="margin: 25px 0;">
        <a href="${FRONTEND_URL}/dashboard/plans" style="background: #33C5E0; color: #0D1A1E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Create Plan →
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Thanks,<br>
        The InheritX Team
      </p>
    </div>
  `;

  return sendEmail(email, subject, text, html);
}

/**
 * Send KYC rejection notification
 */
export async function sendKYCRejectionNotification(
  email: string,
  name: string,
  reason?: string
): Promise<boolean> {
  const subject = 'KYC Verification Update';
  
  const reasonText = reason ? `\n\nReason: ${reason}` : '';
  
  const text = `Hi ${name},

Unfortunately, your KYC verification was not approved.${reasonText}

Please review your submission and try again with:
- A clear, unexpired ID document
- Information that matches your ID exactly

Resubmit: ${FRONTEND_URL}/dashboard/kyc

Thanks,
The InheritX Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #EF4444;">KYC Not Approved</h2>
      
      <p>Hi ${name},</p>
      
      <p>Unfortunately, your KYC verification was <strong>not approved</strong>.</p>
      
      ${reason ? `
        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px 16px; margin: 16px 0;">
          <strong>Reason:</strong> ${reason}
        </div>
      ` : ''}
      
      <p>Please review your submission and try again with:</p>
      <ul style="color: #666;">
        <li>A clear, unexpired ID document</li>
        <li>Information that matches your ID exactly</li>
      </ul>
      
      <p style="margin: 25px 0;">
        <a href="${FRONTEND_URL}/dashboard/kyc" style="background: #33C5E0; color: #0D1A1E; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Resubmit KYC →
        </a>
      </p>
      
      <p style="color: #666; font-size: 14px;">
        Thanks,<br>
        The InheritX Team
      </p>
    </div>
  `;

  return sendEmail(email, subject, text, html);
}

export default {
  sendEmail,
  sendClaimNotification,
  sendKYCApprovalNotification,
  sendKYCRejectionNotification,
};

