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
  const subject = 'InheritX: Your KYC Has Been Approved';
  
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
        .success-box { background: #d4edda; border: 1px solid #28a745; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
        .btn { display: inline-block; background: #33C5E0; color: #0D1A1E; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>InheritX</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <div class="success-box">
            <h3 style="color: #28a745; margin: 0;">✅ KYC Approved!</h3>
            <p>Your identity verification has been successfully completed.</p>
          </div>
          
          <p>You can now create inheritance plans on InheritX. Your verified status allows you to:</p>
          <ul>
            <li>Create unlimited inheritance plans</li>
            <li>Add multiple beneficiaries</li>
            <li>Set various distribution methods</li>
          </ul>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${FRONTEND_URL}/dashboard/plans" class="btn">Create Your First Plan</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} InheritX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, '', html);
}

/**
 * Send KYC rejection notification
 */
export async function sendKYCRejectionNotification(
  email: string,
  name: string,
  reason?: string
): Promise<boolean> {
  const subject = 'InheritX: KYC Verification Update';
  
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
        .warning-box { background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .btn { display: inline-block; background: #33C5E0; color: #0D1A1E; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>InheritX</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <div class="warning-box">
            <h3 style="color: #856404; margin: 0;">KYC Verification Requires Attention</h3>
            <p>Unfortunately, we were unable to verify your identity with the information provided.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>Please resubmit your KYC with the following in mind:</p>
          <ul>
            <li>Ensure your ID document is clear and not expired</li>
            <li>Make sure all information matches your ID exactly</li>
            <li>Upload a high-quality image of your document</li>
          </ul>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${FRONTEND_URL}/dashboard/kyc" class="btn">Resubmit KYC</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} InheritX. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, '', html);
}

export default {
  sendEmail,
  sendClaimNotification,
  sendKYCApprovalNotification,
  sendKYCRejectionNotification,
};

